
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-profile";
import Image from "next/image";
import { MultiSelect } from "@/components/ui/multi-select";
import Link from 'next/link';
import { Combobox } from "@/components/ui/combobox";

const ProfileDashboard = () => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { profile, updateProfile, isLoading: profileLoading } = useProfile();

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    age: '',
    nativeLanguage: '',
    learningLanguages: [] as string[],
    interests: [] as string[]
  });

  const languages = [
    { label: 'English', value: 'english' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'French', value: 'french' },
    { label: 'German', value: 'german' },
    { label: 'Italian', value: 'italian' },
    { label: 'Japanese', value: 'japanese' },
    { label: 'Korean', value: 'korean' },
    { label: 'Mandarin', value: 'mandarin' },
    { label: 'Portuguese', value: 'portuguese' },
    { label: 'Russian', value: 'russian' },
    { label: 'Hindi', value: 'hindi' },
    { label: 'Arabic', value: 'arabic' },
  ];

  const interests = [
    { label: 'Music', value: 'music' },
    { label: 'Movies', value: 'movies' },
    { label: 'Books', value: 'books' },
    { label: 'Sports', value: 'sports' },
    { label: 'Travel', value: 'travel' },
    { label: 'Cooking', value: 'cooking' },
    { label: 'Art', value: 'art' },
    { label: 'Technology', value: 'technology' },
    { label: 'Science', value: 'science' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Photography', value: 'photography' },
    { label: 'Fashion', value: 'fashion' },
  ];

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        age: profile.age ? profile.age.toString() : '',
        nativeLanguage: profile.nativeLanguage || '',
        learningLanguages: profile.learningLanguages || [],
        interests: profile.interests || []
      });
      
      if (profile.profilePic) {
        setImagePreview(profile.profilePic);
      }
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First upload the image if there's a new one
      let profilePicUrl = profile?.profilePic;
      
      if (imageFile) {
        const formData = new FormData();
        formData.append('profilePic', imageFile);
        
        const uploadResponse = await fetch('/api/users/upload-profile', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.message || 'Failed to upload profile picture');
        }
        
        const uploadData = await uploadResponse.json();
        profilePicUrl = uploadData.profilePic;
        
        // Refresh profile after image upload to ensure we have latest data
        await fetchProfile();
      }
      
      // Then update the profile with all data including the new image URL
      const updatedData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        profilePic: profilePicUrl,
        photoURL: profilePicUrl, // Update all image fields for consistency
        image: profilePicUrl,
      };
      
      const result = await updateProfile(updatedData);
      console.log("Profile update result:", result);
      
      // Refresh profile again after updating to ensure we have the latest data
      await fetchProfile();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">Profile Settings</CardTitle>
            <CardDescription>
              Update your profile information
            </CardDescription>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-6 sm:flex-row sm:items-start sm:space-x-6">
            <div className="relative h-32 w-32 rounded-full overflow-hidden mb-4 sm:mb-0">
              {imagePreview ? (
                <Image 
                  src={imagePreview} 
                  alt="Profile" 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-slate-200 flex items-center justify-center text-slate-500">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="profilePic">Profile Picture</Label>
              <Input 
                id="profilePic" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Recommended: Square image, at least 500x500 pixels
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
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
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nativeLanguage">Native Language</Label>
              <Combobox
                id="nativeLanguage"
                options={languages}
                value={formData.nativeLanguage}
                onChange={(value) => setFormData(prev => ({ ...prev, nativeLanguage: value }))}
                placeholder="Select your native language"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="learningLanguages">Learning Languages</Label>
              <MultiSelect
                id="learningLanguages"
                options={languages}
                value={formData.learningLanguages}
                onChange={(values) => setFormData(prev => ({ ...prev, learningLanguages: values }))}
                placeholder="Select languages you're learning"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interests">Interests</Label>
            <MultiSelect
              id="interests"
              options={interests}
              value={formData.interests}
              onChange={(values) => setFormData(prev => ({ ...prev, interests: values }))}
              placeholder="Select your interests"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileDashboard;
