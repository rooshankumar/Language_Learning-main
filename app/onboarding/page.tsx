"use client"

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian",
  "Japanese", "Korean", "Chinese", "Arabic", "Hindi", "Dutch", "Swedish", "Greek",
];

const interestOptions = [
  "Music", "Movies", "Books", "Travel", "Food", "Sports", "Technology",
  "Art", "Photography", "Gaming", "Fitness", "Fashion", "Nature",
  "Politics", "Science", "History", "Business", "Education",
];

export default function Onboarding() {
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [nativeLanguages, setNativeLanguages] = useState<string[]>([]);
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);
  const [proficiency, setProficiency] = useState("beginner");
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(user?.image || "/placeholder-user.jpg");


  // Handle user not being authenticated
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h1 className="mb-4 text-xl font-semibold">User not authenticated</h1>
          <p className="mb-4">Please sign in to continue</p>
          <Button onClick={() => router.push("/sign-in")}>
            Go to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  // Handle adding a native language
  const handleAddNativeLanguage = (language: string) => {
    if (!nativeLanguages.includes(language) && nativeLanguages.length < 3) {
      setNativeLanguages([...nativeLanguages, language]);
    }
  };

  // Handle removing a native language
  const handleRemoveNativeLanguage = (language: string) => {
    setNativeLanguages(nativeLanguages.filter(lang => lang !== language));
  };

  // Handle adding a learning language
  const handleAddLearningLanguage = (language: string) => {
    if (!learningLanguages.includes(language) && learningLanguages.length < 3) {
      setLearningLanguages([...learningLanguages, language]);
    }
  };

  // Handle removing a learning language
  const handleRemoveLearningLanguage = (language: string) => {
    setLearningLanguages(learningLanguages.filter(lang => lang !== language));
  };

  // Handle adding an interest
  const handleAddInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  // Handle removing an interest
  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(int => int !== interest));
  };

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Handle next step
  const handleNextStep = () => {
    if (step === 1 && (nativeLanguages.length === 0 || learningLanguages.length === 0)) {
      toast({
        title: "Please select languages",
        description: "You need to select at least one native language and one language you're learning.",
        variant: "destructive",
      });
      return;
    }

    if (step === 2 && interests.length === 0) {
      toast({
        title: "Please select interests",
        description: "You need to select at least one interest.",
        variant: "destructive",
      });
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Handle completion of onboarding
  const handleComplete = async () => {
    setIsLoading(true);
    try {
      let imageUrl = user?.image;

      // Handle image upload if there's a file
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const uploadRes = await fetch('/api/upload', { // Placeholder API endpoint - needs to be implemented
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload image');
        }

        const { imageUrl: uploadedImageUrl } = await uploadRes.json();
        imageUrl = uploadedImageUrl;
      }

      await updateUserProfile({
        nativeLanguages,
        learningLanguages,
        proficiency,
        interests,
        bio,
        age: age ? parseInt(age) : null,
        isOnboarded: true,
        ...(imageUrl && { image: imageUrl }),
      });

      toast({
        title: "Profile complete!",
        description: "Your profile has been set up successfully.",
      });

      // Force refresh session before redirect
      await fetch('/api/auth/session', { method: 'GET' });

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Setup failed",
        description: "There was an error setting up your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Background Video */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          className="absolute min-h-full min-w-full object-cover opacity-20"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-night-sky-with-stars-at-a-calm-lake-time-lapse-53-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm"></div>
      </div>

      <Card className="w-full max-w-lg shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Set Up Your Profile</CardTitle>
          <CardDescription className="text-center">
            Step {step} of 3: {step === 1 ? "Language Preferences" : step === 2 ? "Your Interests" : "About You"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Native Languages (up to 3)</Label>
                <Select onValueChange={handleAddNativeLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your native languages" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter(language => !nativeLanguages.includes(language))
                      .map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {nativeLanguages.map((language) => (
                    <Badge key={language} variant="secondary" className="px-3 py-1.5 text-sm">
                      {language}
                      <button
                        onClick={() => handleRemoveNativeLanguage(language)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Languages You're Learning (up to 3)</Label>
                <Select onValueChange={handleAddLearningLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select languages you're learning" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter(language => !learningLanguages.includes(language) && !nativeLanguages.includes(language))
                      .map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {learningLanguages.map((language) => (
                    <Badge key={language} variant="secondary" className="px-3 py-1.5 text-sm">
                      {language}
                      <button
                        onClick={() => handleRemoveLearningLanguage(language)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proficiency">Language Proficiency</Label>
                <Select value={proficiency} onValueChange={setProficiency}>
                  <SelectTrigger id="proficiency">
                    <SelectValue placeholder="Select your proficiency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="fluent">Fluent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Select Your Interests</Label>
                <Select onValueChange={handleAddInterest}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add your interests" />
                  </SelectTrigger>
                  <SelectContent>
                    {interestOptions
                      .filter(interest => !interests.includes(interest))
                      .map((interest) => (
                        <SelectItem key={interest} value={interest}>
                          {interest}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-4 min-h-[100px]">
                  {interests.map((interest) => (
                    <Badge key={interest} className="px-3 py-1.5 text-sm">
                      {interest}
                      <button
                        onClick={() => handleRemoveInterest(interest)}
                        className="ml-2 text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <form onSubmit={handleComplete}>
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center space-y-3 mb-6">
                  <div
                    className="relative cursor-pointer group"
                    onClick={handleAvatarClick}
                  >
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={imagePreview} />
                      <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition">
                      <Camera className="text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <span className="text-sm text-muted-foreground">Click to upload profile picture</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={user?.name || ""}
                    onChange={(e) => {/* This needs proper state management */}}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About You</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself, your learning goals, and what you're looking for in language partners."
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Your age"
                    min="13"
                    max="120"
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Complete"}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={step === 1 || isLoading}
          >
            Back
          </Button>
          <Button onClick={handleNextStep} disabled={isLoading}>
            {isLoading
              ? "Processing..."
              : step === 3
                ? "Complete Setup"
                : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}