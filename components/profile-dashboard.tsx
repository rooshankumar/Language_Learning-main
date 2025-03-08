
import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ProfileDashboard({ user = null }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Profile Overview</CardTitle>
          <CardDescription>
            View and manage your profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.image || "/placeholder-user.jpg"} alt="Profile" />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-medium text-lg">{user?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email || "user@example.com"}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">Member</Badge>
                {user?.isOnboarded && <Badge>Onboarded</Badge>}
              </div>
            </div>
            <div className="ml-auto mt-2 sm:mt-0">
              <Button variant="outline" size="sm">Edit Profile</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Messages Sent</span>
                <span className="font-medium">124</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Days Active</span>
                <span className="font-medium">37</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Connections</span>
                <span className="font-medium">18</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {!user ? (
                <p className="text-muted-foreground italic">No recent connections</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>John Doe</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
