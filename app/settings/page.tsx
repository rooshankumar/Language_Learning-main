
"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex items-center mb-6">
          <Link href="/" className="mr-2">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch 
                  id="dark-mode" 
                  checked={darkMode} 
                  onCheckedChange={handleDarkModeToggle} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => signOut()}>Sign Out</Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
