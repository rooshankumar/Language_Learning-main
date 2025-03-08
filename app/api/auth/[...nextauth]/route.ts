
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/User';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import clientPromise from '@/lib/mongodb';

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        try {
          const { db } = await connectToDatabase();
          const user = await db.collection("users").findOne({ email: credentials.email });

          if (!user || !user.password) {
            throw new Error('User not found');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/sign-in',
    signOut: '/',
    error: '/sign-in',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export const authOptions = {
  // Your auth options configuration here
  providers: [
    // Your providers
  ],
  // Other options like callbacks, pages, etc.
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
