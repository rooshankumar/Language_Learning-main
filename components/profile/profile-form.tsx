"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "Chinese",
  "Arabic",
  "Hindi",
]

const interestOptions = [
  "Music",
  "Movies",
  "Books",
  "Travel",
  "Food",
  "Sports",
  "Technology",
  "Art",
  "Photography",
  "Gaming",
  "Fitness",
  "Fashion",
  "Nature",
  "Politics",
  "Science",
  "History",
  "Business",
  "Education",
]

interface ProfileFormProps {
  user: any
  onComplete: () => void
}

export function ProfileForm({ user, onComplete }: ProfileFormProps) {
  const { updateUserProfile } = useAuth()
  const { toast } = useToast()

  const [nativeLanguage, setNativeLanguage] = useState(user.nativeLanguage || "")
  const [learningLanguage, setLearningLanguage] = useState(user.learningLanguage || "")
  const [bio, setBio] = useState(user.bio || "")
  const [interests, setInterests] = useState<string[]>(user.interests || [])
  const [selectedInterest, setSelectedInterest] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddInterest = () => {
    if (selectedInterest && !interests.includes(selectedInterest)) {
      setInterests([...interests, selectedInterest])
      setSelectedInterest("")
    }
  }

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields based on your workflow requirements
      if (!nativeLanguage) {
        toast({
          title: "Error",
          description: "Please select your native language",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!learningLanguage) {
        toast({
          title: "Error",
          description: "Please select at least one language you're learning",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      await updateUserProfile({
        nativeLanguage,
        learningLanguage,
        bio,
        interests,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })

      onComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="native-language">Native Language</Label>
              <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
                <SelectTrigger id="native-language">
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
              <Label htmlFor="learning-language">Language You're Learning</Label>
              <Select value={learningLanguage} onValueChange={setLearningLanguage}>
                <SelectTrigger id="learning-language">
                  <SelectValue placeholder="Select language you're learning" />
                </SelectTrigger>
                <SelectContent>
                  {languages
                    .filter((lang) => lang !== nativeLanguage)
                    .map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">About Me</Label>
            <Textarea
              id="bio"
              placeholder="Tell others about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">Interests</Label>
            <div className="flex gap-2">
              <Select value={selectedInterest} onValueChange={setSelectedInterest}>
                <SelectTrigger id="interests" className="flex-1">
                  <SelectValue placeholder="Select interest" />
                </SelectTrigger>
                <SelectContent>
                  {interestOptions
                    .filter((interest) => !interests.includes(interest))
                    .map((interest) => (
                      <SelectItem key={interest} value={interest}>
                        {interest}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={handleAddInterest} disabled={!selectedInterest}>
                Add
              </Button>
            </div>
          </div>

          {interests.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Interests</Label>
              <div className="flex flex-wrap gap-1">
                {interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="pl-2 pr-1 py-1">
                    {interest}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => handleRemoveInterest(interest)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {interest}</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={onComplete}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

