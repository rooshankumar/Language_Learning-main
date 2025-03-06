"use client"

import { Home, MessageCircle, PanelLeft, User, Users, LogOut } from "lucide-react"
import Link from "next/link"
import { useSidebar } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export function MobileNav() {
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  const { toggleSidebar } = useSidebar()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-background border-t md:hidden">
      <div className="flex items-center justify-around p-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <Home className="h-6 w-6" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chat">
            <MessageCircle className="h-6 w-6" />
            <span className="sr-only">Chat</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/community">
            <Users className="h-6 w-6" />
            <span className="sr-only">Community</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <User className="h-6 w-6" />
            <span className="sr-only">Profile</span>
          </Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-6 w-6" />
          <span className="sr-only">Logout</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeft className="h-6 w-6" />
          <span className="sr-only">Menu</span>
        </Button>
      </div>
    </div>
  )
}

// Placeholder functions for missing features (requires further implementation)
export function setupProfile() {
  // Implement profile setup logic here
  console.log("Profile setup initiated");
}

export function editProfile() {
  // Implement profile editing logic here
  console.log("Profile editing initiated");
}

export function settingsPage() {
  // Implement settings page logic here
  console.log("Settings page accessed");
}

export function handleLanguageSettings() {
    //Implement language settings logic here
    console.log("Language settings initiated")
}