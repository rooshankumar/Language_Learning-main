"use client"

import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "./sidebar-provider"
import { Loader2 } from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AppShell({ children, requireAuth = true }: AppShellProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Protect routes that require authentication
  useEffect(() => {
    if (!loading && !user && requireAuth) {
      router.push("/sign-in")
    }
  }, [user, loading, requireAuth, router])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SidebarProvider>
        <div className="flex h-full min-h-screen">
          <AppSidebar />
          <main className="flex-1 md:pl-64">
            <MobileNav />
            <div className="container py-6">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}