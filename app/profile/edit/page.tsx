"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/use-profile';
import { SectionLayout } from '@/components/ui/section-layout';
import { Loader2, ArrowLeft, Camera } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

const languageOptions = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'russian', label: 'Russian' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'hindi', label: 'Hindi' },
];

const interestOptions = [
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food & Cooking' },
  { value: 'reading', label: 'Reading' },
  { value: 'movies', label: 'Movies & TV' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'technology', label: 'Technology' },
  { value: 'art', label: 'Art & Design' },
  { value: 'science', label: 'Science' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { status } = useSession();
  const { profile, loading, error, updateProfile, uploadProfileImage } = useProfile();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    nativeLanguage: '',
    learningLanguages: [],
    interests: [],
    profilePicture: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        age: profile.age ? profile.age.toString() : '',
        bio: profile.bio || '',
        nativeLanguage: profile.nativeLanguage || '',
        learningLanguages: profile.learningLanguages || [],
        interests: profile.interests || [],
        profilePicture: profile.profilePicture || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    setSaving(true);

    try {
      let updatedData = { ...formData };

      // Upload image if one was selected
      if (imageFile) {
        const imageUrl = await uploadProfileImage(imageFile);
        if (imageUrl) {
          updatedData.profilePicture = imageUrl;
        }
      }

      // Parse age to number
      if (updatedData.age) {
        updatedData = { ...updatedData, age: parseInt(updatedData.age) };
      }

      await updateProfile(updatedData);

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        variant: "success",
      });

      router.push('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SectionLayout 
      title="Edit Profile" 
      description="Update your profile information"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-primary mb-2">
            <Image 
              src={imagePreview || formData.profilePicture || "/placeholder-user.jpg"} 
              alt="Profile" 
              fill 
              className="object-cover"
            />
            <label 
              htmlFor="profilePicture" 
              className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full cursor-pointer"
            >
              <Camera size={16} />
            </label>
            <input 
              id="profilePicture" 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              className="hidden" 
            />
          </div>
          <p className="text-sm text-muted-foreground">Click to change profile picture</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="Your full name" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input 
                id="age" 
                name="age" 
                type="number" 
                value={formData.age} 
                onChange={handleInputChange} 
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
              onChange={handleInputChange} 
              placeholder="Tell us about yourself" 
              rows={4} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nativeLanguage">Native Language</Label>
            <select 
              id="nativeLanguage" 
              name="nativeLanguage" 
              value={formData.nativeLanguage} 
              onChange={handleInputChange as any} 
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Select your native language</option>
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Languages I'm Learning</Label>
            <MultiSelect 
              options={languageOptions}
              selected={formData.learningLanguages}
              onChange={(selected) => setFormData(prev => ({ ...prev, learningLanguages: selected }))}
              placeholder="Select languages you're learning"
            />
          </div>

          <div className="space-y-2">
            <Label>Interests</Label>
            <MultiSelect 
              options={interestOptions}
              selected={formData.interests}
              onChange={(selected) => setFormData(prev => ({ ...prev, interests: selected }))}
              placeholder="Select your interests"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/profile')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </SectionLayout>
  );
}