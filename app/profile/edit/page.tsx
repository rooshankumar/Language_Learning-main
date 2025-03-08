
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { useProfile } from "@/hooks/use-profile";
import { MultiSelect } from "@/components/ui/multi-select";
import { ArrowLeft, ArrowRight, Upload, UserCircle2, Loader2 } from "lucide-react";

const languageOptions = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", 
  "Russian", "Japanese", "Chinese", "Korean", "Arabic", "Hindi"
];

const proficiencyOptions = [
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

  const [step, setStep] = useState(1);
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

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const profile = await getProfile();
        setUserData(profile);
        
        // Initialize form with user data
        setDisplayName(profile.displayName || profile.name || "");
        setBio(profile.bio || "");
        setAge(profile.age?.toString() || "");
        setNativeLanguages(profile.nativeLanguages || (profile.nativeLanguage ? [profile.nativeLanguage] : []));
        setLearningLanguages(profile.learningLanguages || (profile.learningLanguage ? [profile.learningLanguage] : []));
        setProficiency(profile.proficiency || "beginner");
        setInterests(profile.interests || []);
        setImagePreview(profile.profilePic || profile.image || "/placeholder-user.jpg");
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Failed to load profile",
          description: "There was an error loading your profile data.",
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleNextStep = async () => {
    if (step === 3) {
      await handleSaveProfile();
    } else {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Create profile update data
      const profileData: any = {
        displayName,
        bio,
        nativeLanguages,
        learningLanguages,
        proficiency,
        interests,
      };
      
      // Only add age if it's a valid number
      if (age && !isNaN(Number(age))) {
        profileData.age = Number(age);
      }
      
      // Add image file if selected
      if (imageFile) {
        profileData.imageFile = imageFile;
      }
      
      // Update profile
      await updateProfile(profileData);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });
      
      // Redirect to profile page
      router.push("/profile");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Update failed",
        description: error.message || "There was a problem updating your profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Your Profile</CardTitle>
          <CardDescription>
            Update your profile information to better connect with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div onClick={handleAvatarClick} className="relative inline-block cursor-pointer group">
                  <Avatar className="h-24 w-24 mx-auto border-2 border-primary/50 group-hover:border-primary transition-all">
                    <AvatarImage src={imagePreview} alt="Profile" />
                    <AvatarFallback>
                      <UserCircle2 className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
                    <Upload className="h-4 w-4" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Click to change profile picture</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                
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
              </div>
            </div>
          )}

          {/* Step 2: Languages */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Native Language(s)</Label>
                  <MultiSelect
                    options={languageOptions.map(lang => ({ label: lang, value: lang }))}
                    selected={nativeLanguages}
                    onChange={setNativeLanguages}
                    placeholder="Select native languages"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Learning Language(s)</Label>
                  <MultiSelect
                    options={languageOptions.map(lang => ({ label: lang, value: lang }))}
                    selected={learningLanguages}
                    onChange={setLearningLanguages}
                    placeholder="Select languages you're learning"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Proficiency Level</Label>
                  <RadioGroup value={proficiency} onValueChange={setProficiency} className="flex flex-col space-y-1">
                    {proficiencyOptions.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Interests</Label>
                  <MultiSelect
                    options={interestOptions.map(interest => ({ label: interest, value: interest }))}
                    selected={interests}
                    onChange={setInterests}
                    placeholder="Select your interests"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Select interests to help connect with people who share similar hobbies
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={step === 1 || saving}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Button 
            onClick={handleNextStep} 
            disabled={saving}
            className="flex items-center"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : step === 3 ? (
              "Save Profile"
            ) : (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
