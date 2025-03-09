"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ImageUpload } from "@/components/profile/image-upload"
import { Loader2 } from "lucide-react"

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian", 
  "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Turkish", "Dutch", "Swedish"
];

const interests = [
  "Music", "Movies", "Reading", "Travel", "Cooking", "Sports", "Art", 
  "Technology", "Gaming", "Photography", "Dance", "Writing", "History", "Science"
];

export function ProfileDashboard() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    age: '',
    nativeLanguage: '',
    learningLanguage: '',
    interests: [] as string[],
    country: '',
  })

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      console.log("Initializing form with user data:", user);
      setFormData({
        displayName: user.displayName || user.name || '',
        bio: user.bio || '',
        age: user.age ? user.age.toString() : '',
        nativeLanguage: user.nativeLanguage || 'English',
        learningLanguage: user.learningLanguage || 'Spanish',
        interests: user.interests || [],
        country: user.country || '',
      });
    }
  }, [user])

  // Fetch the latest user data from the server on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        console.log("Fetching user profile...");
        const response = await fetch('/api/user/profile');

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: await response.text() || 'Unknown error' };
          }

          console.error("Error fetching profile:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });

          toast({
            title: "Error loading profile",
            description: `Status: ${response.status} - ${errorData.error || response.statusText || 'Unknown error'}`,
            variant: "destructive"
          });
          return;
        }

        const data = await response.json();
        console.log("Server returned profile data:", data);

        if (data.user && updateUser) {
          console.log("Updating user with server data:", data.user);
          updateUser({ user: data.user });

          // Also update the form with latest data from server
          setFormData({
            displayName: data.user.displayName || data.user.name || '',
            bio: data.user.bio || '',
            age: data.user.age ? data.user.age.toString() : '',
            nativeLanguage: data.user.nativeLanguage || 'English',
            learningLanguage: data.user.learningLanguage || 'Spanish',
            interests: data.user.interests || [],
            country: data.user.country || '',
          });

          toast({
            title: "Profile loaded",
            description: "Your profile has been loaded successfully"
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Error loading profile",
          description: error instanceof Error ? error.message : "Failed to load profile data. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchUserProfile();
  }, [updateUser, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLanguageChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const currentInterests = [...prev.interests]
      if (currentInterests.includes(interest)) {
        return { ...prev, interests: currentInterests.filter(i => i !== interest) }
      } else {
        return { ...prev, interests: [...currentInterests, interest] }
      }
    })
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

      // Create the update payload - remove the userId from the payload
      // as the API identifies the user from the session
      const updatePayload = {
        displayName: formData.displayName,
        name: formData.displayName, // Update name field too for consistency
        bio: formData.bio,
        age: formData.age ? parseInt(formData.age) : undefined,
        nativeLanguage: formData.nativeLanguage,
        learningLanguage: formData.learningLanguage,
        interests: formData.interests,
        country: formData.country,
      }

      console.log("Sending profile update:", updatePayload)

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Failed to update profile')
      }

      const data = await response.json()
      console.log("Profile update response:", data)

      // Update user in context with the data returned from the server
      if (updateUser && user) {
        // Just pass the data directly - the context will handle the structure
        updateUser(data);

        // Also update the form with the latest data
        const updatedUser = data.user || data;
        setFormData(prev => ({
          ...prev,
          displayName: updatedUser.displayName || updatedUser.name || prev.displayName,
          bio: updatedUser.bio || prev.bio,
          age: updatedUser.age ? updatedUser.age.toString() : prev.age,
          nativeLanguage: updatedUser.nativeLanguage || prev.nativeLanguage,
          learningLanguage: updatedUser.learningLanguage || prev.learningLanguage,
          interests: updatedUser.interests || prev.interests,
          country: updatedUser.country || prev.country,
        }));
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
    <Card className="w-full max-w-xl mx-auto">
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
            <Label htmlFor="country">Country of Residence</Label>
            <Input
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Your country"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nativeLanguage">Native Language</Label>
            <Select 
              value={formData.nativeLanguage} 
              onValueChange={(value) => handleLanguageChange('nativeLanguage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your native language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="learningLanguage">Learning Language</Label>
            <Select 
              value={formData.learningLanguage} 
              onValueChange={(value) => handleLanguageChange('learningLanguage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language you're learning" />
              </SelectTrigger>
              <SelectContent>
                {languages.filter(lang => lang !== formData.nativeLanguage).map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {interests.map((interest) => (
                <Button
                  key={interest}
                  type="button"
                  variant={formData.interests.includes(interest) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </Button>
              ))}
            </div>
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