"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Home, ArrowLeft, Camera } from "lucide-react";

interface UserData {
  displayName?: string;
  photoURL?: string;
  nativeLanguages?: string[];
  learningLanguages?: string[];
  bio?: string;
  age?: number;
  interests?: string[];
}

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian",
  "Japanese", "Korean", "Chinese", "Arabic", "Hindi", "Dutch", "Swedish", "Greek",
];

const interestOptions = [
  "Music", "Movies", "Books", "Travel", "Food", "Sports", "Technology",
  "Art", "Photography", "Gaming", "Fitness", "Fashion", "Nature",
  "Politics", "Science", "History", "Business", "Education",
];

export default function ProfilePage() {
  const { user, updateUserProfile, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User profile data
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [nativeLanguages, setNativeLanguages] = useState<string[]>([]);
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    // If user is not authenticated, redirect to sign-in
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Initialize form with user data
    setName(user.displayName || "");
    setPhotoURL(user.photoURL || "/placeholder-user.jpg");

    // Safely access user data properties
    const typedUser = user as UserData;
    if (typedUser.nativeLanguages) setNativeLanguages(typedUser.nativeLanguages);
    if (typedUser.learningLanguages) setLearningLanguages(typedUser.learningLanguages);
    if (typedUser.bio) setBio(typedUser.bio);
    if (typedUser.age) setAge(typedUser.age.toString());
    if (typedUser.interests) setInterests(typedUser.interests);
  }, [user, router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;

    setIsLoading(true);
    try {
      const file = e.target.files[0];
      // Placeholder for Replit Object Storage upload (replace with actual implementation)
      const uploadUrl = await uploadProfileImage(file, user.uid);

      await updateUserProfile({ photoURL: uploadUrl });
      setPhotoURL(uploadUrl);
      toast({ title: "Profile image updated", description: "Your profile picture has been updated successfully." });
    } catch (error) {
      console.error("Profile image upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneralUpdate = async () => {
    if (!user) return;

    // Don't proceed if no changes were made
    if (!name && !bio && !age) {
      toast({
        title: "No changes",
        description: "Please make changes before saving.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUserProfile({
        name,
        bio,
        age: age ? parseInt(age) : null,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Profile updated",
        description: "Your general information has been updated successfully.",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageUpdate = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUserProfile({
        nativeLanguages,
        learningLanguages,
      });

      toast({
        title: "Languages updated",
        description: "Your language preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Language update error:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your language preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterestsUpdate = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUserProfile({
        interests,
      });

      toast({
        title: "Interests updated",
        description: "Your interests have been updated successfully.",
      });
    } catch (error) {
      console.error("Interests update error:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your interests.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // This would be implemented with Firebase Auth
    toast({
      title: "Account deletion",
      description: "This feature is not implemented yet.",
      variant: "destructive",
    });
  };

  const handleAddNativeLanguage = (language: string) => {
    if (!nativeLanguages.includes(language)) {
      setNativeLanguages([...nativeLanguages, language]);
    }
  };

  const handleRemoveNativeLanguage = (language: string) => {
    setNativeLanguages(nativeLanguages.filter(lang => lang !== language));
  };

  const handleAddLearningLanguage = (language: string) => {
    if (!learningLanguages.includes(language)) {
      setLearningLanguages([...learningLanguages, language]);
    }
  };

  const handleRemoveLearningLanguage = (language: string) => {
    setLearningLanguages(learningLanguages.filter(lang => lang !== language));
  };

  const handleAddInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(int => int !== interest));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute min-h-full min-w-full object-cover opacity-20"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-night-sky-with-stars-at-a-calm-lake-time-lapse-53-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm"></div>
      </div>

      <AppShell>
        <div className="relative z-10 flex justify-center items-center min-h-[calc(100vh-4rem)] p-4">
          <div className="w-full max-w-4xl">
            <div className="w-full mb-6 flex justify-between items-center">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Back to Home</span>
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="interests">Interests</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Update your profile information and photo.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3 flex flex-col items-center justify-start space-y-4">
                        <div
                          className="relative cursor-pointer group"
                          onClick={handleAvatarClick}
                        >
                          <div className="relative h-48 w-48 rounded-full overflow-hidden border-4 border-primary/20">
                            <img
                              src={photoURL || "/placeholder-user.jpg"}
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                            <Camera className="text-white h-6 w-6" />
                          </div>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Recommended: Square image, at least 400x400px
                        </p>
                      </div>

                      <div className="md:w-2/3 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Display Name</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your display name"
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

                        <div className="space-y-2">
                          <Label htmlFor="bio">About Me</Label>
                          <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell others about yourself"
                            rows={5}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleGeneralUpdate} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="languages">
                <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Language Preferences</CardTitle>
                    <CardDescription>Update your native and learning languages.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Native Languages</Label>
                      <Select onValueChange={handleAddNativeLanguage}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add a native language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages
                            .filter(lang => !nativeLanguages.includes(lang))
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

                    <div className="space-y-4">
                      <Label>Learning Languages</Label>
                      <Select onValueChange={handleAddLearningLanguage}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add a language you're learning" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages
                            .filter(lang => !learningLanguages.includes(lang) && !nativeLanguages.includes(lang))
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
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleLanguageUpdate} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Languages"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="interests">
                <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Your Interests</CardTitle>
                    <CardDescription>Select topics you're interested in.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Select Your Interests</Label>
                      <Select onValueChange={handleAddInterest}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add an interest" />
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

                      <div className="flex flex-wrap gap-2 mt-4">
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
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleInterestsUpdate} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Interests"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences and security.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Email Address</h3>
                      <p className="text-muted-foreground">{user?.email || "No email address"}</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Account Security</h3>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Button variant="outline">Change Password</Button>
                        <Button variant="outline">Enable Two-Factor Authentication</Button>
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          Delete Account
                        </Button>
                        <Button variant="outline" onClick={handleSignOut}>
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </AppShell>
    </div>
  );
}

// Placeholder for Replit Object Storage upload function (requires implementation)
const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
  // Implement your Replit Object Storage upload logic here.  This is a placeholder.
  // This function should upload the file to Replit storage and return the URL.
  // Example using a hypothetical 'replitStorage' library:
  // const url = await replitStorage.uploadFile(file, `users/${userId}/profile.jpg`);
  // return url;
  throw new Error('Replit Object Storage upload not implemented');
};