"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell } from "@/components/app-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="container py-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
            <p className="text-muted-foreground">View and manage your language learning profile</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Profile Overview</h2>
              <p>View your profile summary and stats.</p>
            </div>
          </TabsContent>
          <TabsContent value="achievements" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Achievements</h2>
              <p>Track your learning milestones and accomplishments.</p>
            </div>
          </TabsContent>
          <TabsContent value="languages" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Language Progress</h2>
              <p>View your progress in each language you're learning.</p>
            </div>
          </TabsContent>
          <TabsContent value="activity" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <p>Your recent learning activities and interactions.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}