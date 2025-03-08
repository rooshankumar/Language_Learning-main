
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SectionLayout } from '@/components/ui/section-layout';
import { Loader2, ArrowLeft, Home } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/profile/image-upload';
import { useToast } from '@/components/ui/use-toast';
import { useProfile } from '@/hooks/use-profile';

const languageOptions = [
  { label: 'English', value: 'english' },
  { label: 'Spanish', value: 'spanish' },
  { label: 'French', value: 'french' },
  { label: 'German', value: 'german' },
  { label: 'Italian', value: 'italian' },
  { label: 'Portuguese', value: 'portuguese' },
  { label: 'Russian', value: 'russian' },
  { label: 'Chinese', value: 'chinese' },
  { label: 'Japanese', value: 'japanese' },
  { label: 'Korean', value: 'korean' },
  { label: 'Arabic', value: 'arabic' },
  { label: 'Hindi', value: 'hindi' }
];

const proficiencyOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Fluent', value: 'fluent' }
];

const interestOptions = [
  { label: 'Movies', value: 'movies' },
  { label: 'Music', value: 'music' },
  { label: 'Books', value: 'books' },
  { label: 'Travel', value: 'travel' },
  { label: 'Food', value: 'food' },
  { label: 'Sports', value: 'sports' },
  { label: 'Art', value: 'art' },
  { label: 'Technology', value: 'technology' },
  { label: 'Science', value: 'science' },
  { label: 'History', value: 'history' }
];

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const { profile, loading, updateProfile, uploadProfileImage } = useProfile();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    age: '',
    nativeLanguage: '',
    learningLanguage: '',
    nativeLanguages: [],
    learningLanguages: [],
    proficiency: '',
    interests: [],
    profilePic: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || profile.name || '',
        bio: profile.bio || '',
        age: profile.age?.toString() || '',
        nativeLanguage: profile.nativeLanguage || '',
        learningLanguage: profile.learningLanguage || '',
        nativeLanguages: profile.nativeLanguages || [],
        learningLanguages: profile.learningLanguages || [],
        proficiency: profile.proficiency || 'beginner',
        interests: profile.interests || [],
        profilePic: profile.profilePic || profile.image || '/placeholder-user.jpg',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (file) => {
    try {
      setSaving(true);
      const imageUrl = await uploadProfileImage(file);
      setFormData(prev => ({ ...prev, profilePic: imageUrl }));
      
      // Update profile with new image immediately
      await updateProfile({ profilePic: imageUrl });
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your display name",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaving(true);
      
      const updatedData = {
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
      };
      
      await updateProfile(updatedData);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error.message || "There was a problem updating your profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/sign-in');
    return null;
  }

  return (
    <SectionLayout
      title="Your Profile"
      description="Manage your profile information"
    >
      <Card className="w-full shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <ImageUpload 
                value={formData.profilePic}
                onChange={handleImageUpload}
                disabled={saving}
              />
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                    min="13"
                    max="120"
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
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nativeLanguage">Native Language</Label>
                  <Select
                    value={formData.nativeLanguage}
                    onValueChange={(value) => handleSelectChange('nativeLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
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
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Native Languages</Label>
                <MultiSelect
                  options={languageOptions}
                  selected={formData.nativeLanguages}
                  onChange={(value) => handleSelectChange('nativeLanguages', value)}
                  placeholder="Select languages you speak natively"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Learning Languages</Label>
                <MultiSelect
                  options={languageOptions}
                  selected={formData.learningLanguages}
                  onChange={(value) => handleSelectChange('learningLanguages', value)}
                  placeholder="Select languages you're learning"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proficiency">Proficiency Level</Label>
                <Select
                  value={formData.proficiency}
                  onValueChange={(value) => handleSelectChange('proficiency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your proficiency level" />
                  </SelectTrigger>
                  <SelectContent>
                    {proficiencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Interests</Label>
                <MultiSelect
                  options={interestOptions}
                  selected={formData.interests}
                  onChange={(value) => handleSelectChange('interests', value)}
                  placeholder="Select your interests"
                />
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/')}
              >
                <Home className="mr-2 h-4 w-4" /> Back to Home
              </Button>

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </SectionLayout>
  );
}
