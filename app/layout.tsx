import { Providers } from "@/components/providers";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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