"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/components/sidebar-provider";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            {children}
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}