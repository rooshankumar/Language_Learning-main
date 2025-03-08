
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
