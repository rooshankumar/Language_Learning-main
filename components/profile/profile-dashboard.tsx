
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, User2, Languages, Book, MusicIcon, Globe, Loader2, UserCircle2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useToast } from "@/components/ui/use-toast";

export function ProfileDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const { getProfile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getProfile();
        setProfileData(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Failed to load profile",
          description: "There was an error loading your profile data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session, getProfile, toast]);

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p>Could not load profile data</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center justify-between">
          <span>Your Profile</span>
          <Button size="sm" variant="ghost" onClick={handleEditProfile}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
        </CardTitle>
        <CardDescription>
          View and manage your profile information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <Avatar className="h-24 w-24 border-2 border-primary/50">
            <AvatarImage src={profileData.profilePic || profileData.image || "/placeholder-user.jpg"} alt={profileData.displayName || profileData.name} />
            <AvatarFallback>
              <UserCircle2 className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div>
              <h3 className="text-xl font-semibold">
                {profileData.displayName || profileData.name || "User"}
              </h3>
              <p className="text-muted-foreground">{profileData.email}</p>
            </div>
            
            {profileData.bio && (
              <div>
                <p className="text-sm">{profileData.bio}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {profileData.age && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Age
              </h4>
              <p>{profileData.age} years</p>
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <User2 className="h-4 w-4" /> Native Language
            </h4>
            <div className="flex flex-wrap gap-1">
              {profileData.nativeLanguages && profileData.nativeLanguages.length > 0 ? (
                profileData.nativeLanguages.map((lang: string) => (
                  <Badge key={lang} variant="outline">{lang}</Badge>
                ))
              ) : profileData.nativeLanguage ? (
                <Badge variant="outline">{profileData.nativeLanguage}</Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Not specified</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Languages className="h-4 w-4" /> Learning
            </h4>
            <div className="flex flex-wrap gap-1">
              {profileData.learningLanguages && profileData.learningLanguages.length > 0 ? (
                profileData.learningLanguages.map((lang: string) => (
                  <Badge key={lang} variant="outline">{lang}</Badge>
                ))
              ) : profileData.learningLanguage ? (
                <Badge variant="outline">{profileData.learningLanguage}</Badge>
              ) : (
                <span className="text-muted-foreground text-sm">No learning languages specified</span>
              )}
            </div>
          </div>
        </div>
        
        {(profileData.interests && profileData.interests.length > 0) && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MusicIcon className="h-4 w-4" /> Interests
            </h4>
            <div className="flex flex-wrap gap-1">
              {profileData.interests.map((interest: string) => (
                <Badge key={interest} variant="secondary" className="bg-primary/10">{interest}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {profileData.proficiency && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" /> Proficiency Level
            </h4>
            <Badge variant="outline" className="capitalize">{profileData.proficiency}</Badge>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleEditProfile} className="w-full">
          Update Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
