'use client';

import { Providers } from "@/components/providers";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { updateLastActive } from '@/lib/user-activity';

const inter = Inter({ subsets: ["latin"] });

// This will redirect from the root to the community page
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return {
    title: "LinguaConnect",
    description: "Connect with language learners around the world",
    refresh: {
      httpEquiv: "refresh",
      content: "0;url=/community",
    },
  };
}

function UserActivityTracker() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;

    // Update lastActive when component mounts
    updateLastActive();

    // Update lastActive every 5 minutes while the user is on the site
    const interval = setInterval(() => {
      updateLastActive();
    }, 5 * 60 * 1000);

    // Update lastActive when user interacts with the page
    const handleActivity = () => {
      updateLastActive();
    };

    // Add event listeners for user activity
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Clean up
    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [status]);

  return null;
}

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers session={session}>
          <UserActivityTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}