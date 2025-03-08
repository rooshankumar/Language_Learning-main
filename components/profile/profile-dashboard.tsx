
"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Loader2, Camera } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Chinese",
  "Japanese",
  "Korean",
  "Russian",
  "Arabic",
  "Hindi",
  "Portuguese"
];

export function ProfileDashboard() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    nativeLanguage: '',
    learningLanguage: '',
    age: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || user.name || '',
        bio: user.bio || '',
        nativeLanguage: user.nativeLanguage || '',
        learningLanguage: user.learningLanguage || '',
        age: user.age ? user.age.toString() : '',
      })
      if (user.profilePicture) {
        setImagePreview(user.profilePicture)
      }
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      
      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
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
      
      let profilePictureUrl = user?.profilePicture

      // Upload image if a new one was selected
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image')
        }
        
        const imageData = await uploadResponse.json()
        profilePictureUrl = imageData.url
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
          nativeLanguage: formData.nativeLanguage,
          learningLanguage: formData.learningLanguage,
          age: formData.age ? parseInt(formData.age) : undefined,
          profilePicture: profilePictureUrl,
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
          nativeLanguage: formData.nativeLanguage,
          learningLanguage: formData.learningLanguage,
          age: formData.age ? parseInt(formData.age) : undefined,
          profilePicture: profilePictureUrl,
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Manage your profile information
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col items-center">
          <div 
            className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-primary mb-2 cursor-pointer"
            onClick={handleImageClick}
          >
            <div className="w-full h-full relative">
              <Image 
                src={imagePreview || user?.profilePicture || "/placeholder-user.jpg"} 
                alt="Profile" 
                fill 
                className="object-cover"
              />
              <div className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full">
                <Camera size={16} />
              </div>
            </div>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            className="hidden" 
          />
          <p className="text-sm text-muted-foreground">Click to change profile picture</p>
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
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              placeholder="Your age"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nativeLanguage">Native Language</Label>
            <Select 
              value={formData.nativeLanguage} 
              onValueChange={(value) => handleSelectChange('nativeLanguage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your native language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(language => (
                  <SelectItem key={language} value={language}>{language}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="learningLanguage">Learning Language</Label>
            <Select 
              value={formData.learningLanguage} 
              onValueChange={(value) => handleSelectChange('learningLanguage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language you're learning" />
              </SelectTrigger>
              <SelectContent>
                {languages
                  .filter(lang => lang !== formData.nativeLanguage)
                  .map(language => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
