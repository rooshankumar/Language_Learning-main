
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, User2, Languages, Book, MusicIcon, Globe, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useToast } from "@/hooks/use-toast";

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
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>My Profile</CardTitle>
          <Button onClick={handleEditProfile} variant="outline" size="sm" className="flex items-center gap-1">
            <Edit className="h-4 w-4" /> Edit
          </Button>
        </div>
        <CardDescription>
          Your personal profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            <AvatarImage 
              src={profileData.profilePic || profileData.image || '/placeholder-user.jpg'} 
              alt={profileData.displayName || profileData.name || "User"} 
            />
            <AvatarFallback>{(profileData.displayName || profileData.name || "U").charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-semibold">{profileData.displayName || profileData.name}</h3>
            {profileData.age && (
              <div className="flex items-center justify-center sm:justify-start gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{profileData.age} years old</span>
              </div>
            )}
          </div>
        </div>
        
        {profileData.bio && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <User2 className="h-4 w-4" /> About
            </h4>
            <p className="text-muted-foreground">{profileData.bio}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Languages className="h-4 w-4" /> Native Languages
            </h4>
            <div className="flex flex-wrap gap-1">
              {profileData.nativeLanguages && profileData.nativeLanguages.length > 0 ? (
                profileData.nativeLanguages.map((lang: string) => (
                  <Badge key={lang} variant="secondary">{lang}</Badge>
                ))
              ) : profileData.nativeLanguage ? (
                <Badge variant="secondary">{profileData.nativeLanguage}</Badge>
              ) : (
                <span className="text-muted-foreground text-sm">No native languages specified</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Book className="h-4 w-4" /> Learning Languages
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
