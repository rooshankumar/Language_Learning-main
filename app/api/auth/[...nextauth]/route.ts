import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
// Using adapter is commented out since we're handling auth manually
// import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import clientPromise from "@/lib/mongodb";
import { MongoDBAdapter } from "@auth/mongodb-adapter";


export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await connectToDatabase();

        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          isOnboarded: user.isOnboarded
        };
      }
    })
  ],
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-out",
    error: "/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isOnboarded = user.isOnboarded;
        // Include all user data from DB
        token.userData = user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isOnboarded = token.isOnboarded as boolean;

        // Include full user data from MongoDB
        if (token.userData) {
          session.user = {
            ...session.user,
            ...token.userData
          };
        }
      }
      return session;
    },
  },
  adapter: MongoDBAdapter(clientPromise),
};

import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongoose";

const handler = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
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
            throw new Error("User not found");
          }
          
          if (!user.password) {
            console.log("User has no password (may be using OAuth)");
            throw new Error("Invalid login method");
          }
          
          // Debug log
          console.log("User found, verifying password...");
          
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            console.log("Password verification failed");
            throw new Error("Invalid credentials");
          }
          
          console.log("Authentication successful");
          
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image || user.photoURL,
            isOnboarded: user.isOnboarded,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
});

export { handler as GET, handler as POST };
