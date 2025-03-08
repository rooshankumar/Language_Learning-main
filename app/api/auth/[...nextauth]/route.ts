
import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import clientPromise from "@/lib/mongodb";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in', // Error code passed in query string
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to the token when a user signs in
      if (user) {
        token.id = user.id;
        token.isOnboarded = user.isOnboarded || false;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom user data from token to the session
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.isOnboarded = token.isOnboarded as boolean;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Invalid credentials - missing email or password");
          return null;
        }
        
        try {
          await connectToDatabase();
          
          // Debug log
          console.log(`Attempting to find user with email: ${credentials.email}`);
          
          const user = await User.findOne({ email: credentials.email.toLowerCase() });
          
          if (!user) {
            console.log(`User not found with email: ${credentials.email}`);
            return null;
          }
          
          // Check if user has a password (some users might be using OAuth)
          if (!user.password) {
            console.log(`User exists but has no password (possibly OAuth user): ${credentials.email}`);
            return null;
          }
          
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            console.log(`Invalid password for user: ${credentials.email}`);
            return null;
          }
          
          console.log(`User authenticated successfully: ${credentials.email}`);
          
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image || user.photoURL,
            isOnboarded: user.isOnboarded || false
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    }),
    // Add Google provider if configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                isOnboarded: false
              };
            }
          })
        ]
      : [])
  ]
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
