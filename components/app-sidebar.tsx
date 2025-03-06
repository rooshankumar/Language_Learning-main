"use client"

import type React from "react"

import { useSidebar } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Globe, Home, MessageCircle, PanelLeft, Settings, User, Users, LogOut } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

export function AppSidebar() {
  const { isMobile, openMobile, setOpenMobile, state, toggleSidebar } = useSidebar()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center p-4">
        <div className="flex items-center gap-2 font-bold text-xl">
          {state === "expanded" && <span>LinguaConnect</span>}
          {state === "collapsed" && <span>LC</span>}
        </div>
        {!isMobile && (
          <Button variant="ghost" size="icon" className="ml-auto" onClick={toggleSidebar}>
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        )}
      </div>
      <Separator className="bg-sidebar-border" />
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          <NavItem href="/" icon={Home} label="Dashboard" />
          <NavItem href="/chat" icon={MessageCircle} label="Chat" />
          <NavItem href="/community" icon={Users} label="Community" />
          <NavItem href="/profile" icon={User} label="Profile" />
          <NavItem href="/settings" icon={Settings} label="Settings" />
        </nav>
      </div>
      <Separator className="bg-sidebar-border" />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary p-1">
              <Globe className="h-4 w-4 text-primary-foreground" />
            </div>
            {state === "expanded" && (
              <div className="text-xs">
                <div className="font-medium">English → Spanish</div>
                <div className="text-sidebar-foreground/70">Intermediate</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0 w-[280px]">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      data-state={state}
      className={cn(
        "hidden md:block h-screen bg-sidebar text-sidebar-foreground transition-all duration-300",
        state === "expanded" ? "w-64" : "w-16",
      )}
    >
      {sidebarContent}
    </div>
  )
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ElementType
  label: string
}) {
  const { state } = useSidebar()

  return (
    <Button asChild variant="ghost" className="justify-start">
      <Link href={href} className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        {state === "expanded" && <span>{label}</span>}
      </Link>
    </Button>
  )
}