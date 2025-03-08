"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell } from "@/components/app-shell"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"


export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('theme') === 'dark' : false
  )
  const [notifications, setNotifications] = useState(true)
  const [saveSettings, setSaveSettings] = useState(false)

  const handleDarkModeToggle = () => {
    const newMode = !darkMode
    setDarkMode(newMode)

    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newMode ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', newMode)
    }
  }

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully."
    })
  }

  const handleDeleteAccount = () => {
    // This would need additional confirmation in a real app
    toast({
      variant: "destructive",
      title: "Account deletion",
      description: "This feature is not yet implemented for safety reasons."
    })
  }

  return (
    <AppShell>
      <div className="container py-6 space-y-8">
        <div>
          <Link href="/" className="mr-2">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>

        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Profile Settings</h2>
              <div className="flex flex-col gap-1">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={() => user?.signOut()}>Sign Out</Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
            </div>
          </TabsContent>
          <TabsContent value="preferences" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Preferences</h2>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Notification Settings</h2>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="save-settings">Remember Settings</Label>
                <Switch
                  id="save-settings"
                  checked={saveSettings}
                  onCheckedChange={setSaveSettings}
                />
              </div>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}