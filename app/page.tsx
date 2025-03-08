"use client"

import { useAuth } from "@/contexts/auth-context"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Users, MessageSquare } from "lucide-react"
import { ProfileDashboard } from "@/components/profile-dashboard"

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">
          <div className="flex-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Welcome {user?.displayName || "User"}
                </CardTitle>
                <CardDescription>
                  Manage your profile and connect with others through chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="profile">
                  <TabsList className="mb-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="community">Community</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile">
                    <ProfileDashboard />
                  </TabsContent>

                  <TabsContent value="community">
                    <div className="flex flex-col items-center justify-center min-h-[300px] p-4 text-center">
                      <Users className="h-12 w-12 mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Explore the Community</h3>
                      <p className="text-muted-foreground mb-6">
                        Connect with other users and start conversations
                      </p>
                      <Button asChild>
                        <a href="/community">Browse Community</a>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}