import { Providers } from "@/components/providers";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Language Learning App",
  description: "Connect with language learners around the world",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}

// auth-context.tsx (Assumed file;  Adjust path if necessary)
import React, { createContext, useContext, useState, useEffect } from 'react'; // Added useContext import

const AuthContext = createContext();

export const AuthProvider = ({ children, session }) => {
  const [user, setUser] = useState(session?.user || null);

  useEffect(() => {
    setUser(session?.user || null);
  }, [session]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext); // Now useContext is defined
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};