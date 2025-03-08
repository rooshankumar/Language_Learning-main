
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-profile";
import { Loader2, User, Upload } from "lucide-react";

// Language options
const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", 
  "Russian", "Japanese", "Mandarin", "Korean", "Arabic", "Hindi", 
  "Bengali", "Dutch", "Swedish", "Norwegian", "Danish", "Finnish", 
  "Greek", "Turkish", "Polish", "Ukrainian", "Hebrew", "Thai", 
  "Vietnamese", "Indonesian", "Malay", "Tagalog", "Swahili"
];

// Interest options
const interestOptions = [
  "Music", "Movies", "Books", "Travel", "Food", "Sports", "Technology",
  "Art", "Photography", "Gaming", "Fitness", "Fashion", "Nature",
  "Politics", "Science", "History", "Business", "Education", "Dance",
  "Cooking", "Writing", "Reading", "Hiking", "Yoga", "Meditation",
  "Crafts", "DIY", "Gardening", "Animals", "Volunteering"
];

// Form validation schema
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  bio: z.string().max(500, "Bio must be less than 500 characters."),
  age: z.string().refine((val) => !val || !isNaN(parseInt(val)), {
    message: "Age must be a number."
  }),
  nativeLanguages: z.array(z.string()).min(1, "Select at least one native language."),
  learningLanguages: z.array(z.string()).min(1, "Select at least one language you're learning."),
  proficiency: z.string(),
  interests: z.array(z.string()),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { getProfile, updateProfile, loading } = useProfile();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      age: "",
      nativeLanguages: [],
      learningLanguages: [],
      proficiency: "beginner",
      interests: [],
    },
  });

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await getProfile();
        
        if (profileData) {
          form.reset({
            name: profileData.name || "",
            bio: profileData.bio || "",
            age: profileData.age ? String(profileData.age) : "",
            nativeLanguages: profileData.nativeLanguages && profileData.nativeLanguages.length > 0 
              ? profileData.nativeLanguages 
              : profileData.nativeLanguage ? [profileData.nativeLanguage] : [],
            learningLanguages: profileData.learningLanguages && profileData.learningLanguages.length > 0 
              ? profileData.learningLanguages 
              : profileData.learningLanguage ? [profileData.learningLanguage] : [],
            proficiency: profileData.proficiency || "beginner",
            interests: profileData.interests || [],
          });
          
          setImagePreview(profileData.image || "/placeholder-user.jpg");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error loading profile",
          description: "Failed to load your profile data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      loadProfile();
    } else {
      router.push("/sign-in");
    }
  }, [session, getProfile, form, router, toast]);

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

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile({
        ...data,
        age: data.age ? parseInt(data.age) : undefined,
        nativeLanguage: data.nativeLanguages[0],
        learningLanguage: data.learningLanguages[0],
        imageFile: imageFile,
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      router.push("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your profile information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4 mb-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <Avatar 
                  className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={handleAvatarClick}
                >
                  <AvatarImage src={imagePreview} alt="Profile" />
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAvatarClick}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Picture
                </Button>
              </div>

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description about yourself to share with other users.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Age */}
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input placeholder="Your age" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Native Languages */}
              <FormField
                control={form.control}
                name="nativeLanguages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Native Languages</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder="Select languages"
                        options={languages.map(lang => ({ label: lang, value: lang }))}
                        value={field.value.map(lang => ({ label: lang, value: lang }))}
                        onChange={(selected) => field.onChange(selected.map(item => item.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Learning Languages */}
              <FormField
                control={form.control}
                name="learningLanguages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Languages</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder="Select languages"
                        options={languages.map(lang => ({ label: lang, value: lang }))}
                        value={field.value.map(lang => ({ label: lang, value: lang }))}
                        onChange={(selected) => field.onChange(selected.map(item => item.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Proficiency */}
              <FormField
                control={form.control}
                name="proficiency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language Proficiency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your proficiency level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="fluent">Fluent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Interests */}
              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder="Select your interests"
                        options={interestOptions.map(interest => ({ label: interest, value: interest }))}
                        value={field.value.map(interest => ({ label: interest, value: interest }))}
                        onChange={(selected) => field.onChange(selected.map(item => item.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Select interests to find language partners with similar hobbies.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Camera } from "lucide-react"
import { useSession } from "next-auth/react"
import { useProfile } from "@/hooks/use-profile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"

const languageOptions = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi"
];

const proficiencyLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "fluent", label: "Fluent" },
  { value: "native", label: "Native" }
];

const interestOptions = [
  "Music", "Movies", "Books", "Travel", "Food", "Sports", "Technology",
  "Art", "Photography", "Gaming", "Fitness", "Fashion", "Nature",
  "Politics", "Science", "History", "Business", "Education",
];

export default function EditProfile() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { updateProfile, getProfile, loading: profileLoading } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [nativeLanguages, setNativeLanguages] = useState<string[]>([]);
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);
  const [proficiency, setProficiency] = useState("beginner");
  const [interests, setInterests] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("/placeholder-user.jpg");

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getProfile();
        setUserData(data);
        
        // Set form state from user data
        setDisplayName(data.name || data.displayName || "");
        setBio(data.bio || "");
        setAge(data.age ? data.age.toString() : "");
        setNativeLanguages(data.nativeLanguages || []);
        setLearningLanguages(data.learningLanguages || []);
        setProficiency(data.proficiency || "beginner");
        setInterests(data.interests || []);
        setImagePreview(data.image || data.profilePic || "/placeholder-user.jpg");
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load your profile data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchUserData();
    }
  }, [session, getProfile, toast]);

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

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      // Create profile update object
      const profileData: any = {
        displayName,
        name: displayName, // Update name field for consistency
        bio,
        nativeLanguages,
        learningLanguages,
        proficiency,
        interests,
      };
      
      // Add age if provided
      if (age) {
        profileData.age = parseInt(age);
      }
      
      // Add image file if provided
      if (imageFile) {
        profileData.imageFile = imageFile;
      }
      
      // Update profile
      await updateProfile(profileData);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Redirect back to profile page
      router.push("/profile");
      router.refresh();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="interests">Interests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group"
                  onClick={handleAvatarClick}
                >
                  <Image
                    src={imagePreview}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
                <button 
                  className="text-sm text-primary mt-2"
                  onClick={handleAvatarClick}
                >
                  Change Photo
                </button>
              </div>
              
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              
              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>
              
              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age">Age (optional)</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button onClick={() => setActiveTab("languages")}>Next</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle>Language Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Native Languages */}
              <div className="space-y-2">
                <Label htmlFor="nativeLanguages">Native Languages</Label>
                <MultiSelect
                  options={languageOptions.map(lang => ({ value: lang, label: lang }))}
                  selected={nativeLanguages}
                  onChange={setNativeLanguages}
                  placeholder="Select your native languages"
                />
              </div>
              
              {/* Learning Languages */}
              <div className="space-y-2">
                <Label htmlFor="learningLanguages">Languages You're Learning</Label>
                <MultiSelect
                  options={languageOptions.map(lang => ({ value: lang, label: lang }))}
                  selected={learningLanguages}
                  onChange={setLearningLanguages}
                  placeholder="Select languages you're learning"
                />
              </div>
              
              {/* Proficiency */}
              <div className="space-y-2">
                <Label htmlFor="proficiency">Proficiency Level</Label>
                <Select value={proficiency} onValueChange={setProficiency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your proficiency level" />
                  </SelectTrigger>
                  <SelectContent>
                    {proficiencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("basic")}>Previous</Button>
              <Button onClick={() => setActiveTab("interests")}>Next</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="interests">
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="interests">Select Your Interests</Label>
                <MultiSelect
                  options={interestOptions.map(interest => ({ value: interest, label: interest }))}
                  selected={interests}
                  onChange={setInterests}
                  placeholder="Select your interests"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("languages")}>Previous</Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
