
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ImageUpload } from "@/components/profile/image-upload"
import { Loader2 } from "lucide-react"

export function ProfileDashboard() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
  })

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || user.name || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.displayName.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your display name",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      const userId = user?.id || user?._id
      
      if (!userId) {
        throw new Error('User ID not found')
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          displayName: formData.displayName,
          name: formData.displayName, // Update name field too for consistency
          bio: formData.bio,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }
      
      const data = await response.json()
      
      // Update user in context
      if (updateUser && user) {
        updateUser({
          ...user,
          displayName: formData.displayName,
          name: formData.displayName,
          bio: formData.bio,
        })
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update failed",
        description: error.message || "There was a problem updating your profile",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Manage your profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <ImageUpload />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Your name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
