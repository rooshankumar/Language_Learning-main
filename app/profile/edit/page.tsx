"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/components/ui/use-toast";
import { useProfile } from "@/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ArrowLeft, ArrowRight, Upload, UserCircle2 } from "lucide-react";

const languageOptions = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi"
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

        // Initialize form state with user data
        setDisplayName(profile.displayName || profile.name || "");
        setBio(profile.bio || "");
        setAge(profile.age ? profile.age.toString() : "");
        setNativeLanguages(profile.nativeLanguages || []);
        setLearningLanguages(profile.learningLanguages || []);
        setProficiency(profile.proficiency || "beginner");
        setInterests(profile.interests || []);
        setImagePreview(profile.profilePic || profile.image || "/placeholder-user.jpg");
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again later.",
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

  // Handle form submission
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updatedProfile = {
        displayName,
        bio,
        age: age ? parseInt(age) : undefined,
        nativeLanguages,
        learningLanguages,
        proficiency,
        interests,
        imageFile,
      };

      await updateProfile(updatedProfile);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
      handleSaveProfile();
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
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
          {/* Step 1: Languages */}
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
                  />
                </div>

                <div className="space-y-2">
                  <Label>Native Languages</Label>
                  <MultiSelect
                    options={languageOptions.map(lang => ({ label: lang, value: lang }))}
                    selected={nativeLanguages}
                    onChange={setNativeLanguages}
                    placeholder="Select native languages"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Learning Languages</Label>
                  <MultiSelect
                    options={languageOptions.map(lang => ({ label: lang, value: lang }))}
                    selected={learningLanguages}
                    onChange={setLearningLanguages}
                    placeholder="Select languages you're learning"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Language Proficiency</Label>
                  <RadioGroup value={proficiency} onValueChange={setProficiency} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="beginner" id="beginner" />
                      <Label htmlFor="beginner">Beginner</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="intermediate" id="intermediate" />
                      <Label htmlFor="intermediate">Intermediate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <Label htmlFor="advanced">Advanced</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Your Interests</h3>
              <p className="text-muted-foreground mb-4">
                Select interests to help connect with like-minded language partners
              </p>

              <div className="space-y-4">
                <Label>Interests</Label>
                <MultiSelect
                  options={interestOptions.map(interest => ({ label: interest, value: interest }))}
                  selected={interests}
                  onChange={setInterests}
                  placeholder="Select your interests"
                />
              </div>
            </div>
          )}

          {/* Step 3: Personal Info */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">About You</h3>
              <p className="text-muted-foreground mb-4">
                Complete your profile with a bio and additional information
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
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