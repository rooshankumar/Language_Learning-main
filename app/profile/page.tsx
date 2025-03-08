
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell } from "@/components/app-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProfileDashboard } from "@/components/profile-dashboard"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  if (isLoading) {
    return (
      <AppShell>
        <div className="container py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="container py-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.profilePic || user?.photoURL || user?.image || "/placeholder-user.jpg"} alt={user?.displayName || user?.name || "User"} />
            <AvatarFallback>{user?.displayName?.charAt(0) || user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold mb-2">{user?.displayName || user?.name || "Your Profile"}</h1>
            <p className="text-muted-foreground">View and manage your language learning profile</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user?.bio && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Bio</h3>
                      <p>{user.bio}</p>
                    </div>
                  )}
                  
                  {user?.age && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Age</h3>
                      <p>{user.age} years</p>
                    </div>
                  )}
                  
                  {user?.country && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Country</h3>
                      <p>{user.country}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Joined</h3>
                    <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Language Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user?.nativeLanguage && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Native Language</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {user.nativeLanguage}
                      </Badge>
                    </div>
                  )}
                  
                  {user?.learningLanguage && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Learning</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {user.learningLanguage}
                      </Badge>
                    </div>
                  )}
                  
                  {user?.proficiency && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Proficiency Level</h3>
                      <Badge>{user.proficiency}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user?.interests && user.interests.length > 0 ? (
                      user.interests.map((interest: string) => (
                        <Badge key={interest} variant="secondary">{interest}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No interests added yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="edit" className="mt-6">
            <ProfileDashboard />
          </TabsContent>
          
          <TabsContent value="languages" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Language Progress</h2>
              <p>View your progress in each language you're learning.</p>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">Language progress tracking coming soon!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="activity" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <p>Your recent learning activities and interactions.</p>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">Activity tracking coming soon!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
