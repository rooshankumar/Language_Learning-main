
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Calculate join date
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <p>Profile data not available.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push("/onboarding")}
            >
              Complete Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Profile</CardTitle>
            <Button size="sm" variant="outline" onClick={handleEditProfile}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.image || "/placeholder-user.jpg"} alt={profileData.name} />
                <AvatarFallback>{profileData.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold">{profileData.name}</h3>
                <p className="text-muted-foreground">{profileData.email}</p>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Joined {formatJoinDate(profileData.createdAt)}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {/* Bio */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center">
                  <User2 className="h-4 w-4 mr-2" />
                  Bio
                </h4>
                <p className="text-sm text-muted-foreground">
                  {profileData.bio || "No bio provided yet."}
                </p>
              </div>

              {/* Age */}
              {profileData.age && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Age</h4>
                  <p className="text-sm text-muted-foreground">{profileData.age}</p>
                </div>
              )}

              {/* Languages */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center">
                  <Languages className="h-4 w-4 mr-2" />
                  Languages
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Native</p>
                    <div className="flex flex-wrap gap-2">
                      {(profileData.nativeLanguages && profileData.nativeLanguages.length > 0 ? 
                        profileData.nativeLanguages : 
                        [profileData.nativeLanguage]).map((lang: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-primary/10">
                          <Globe className="h-3 w-3 mr-1" />
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Learning ({profileData.proficiency || "beginner"})</p>
                    <div className="flex flex-wrap gap-2">
                      {(profileData.learningLanguages && profileData.learningLanguages.length > 0 ? 
                        profileData.learningLanguages : 
                        [profileData.learningLanguage]).map((lang: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-secondary/10">
                          <Book className="h-3 w-3 mr-1" />
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center">
                  <MusicIcon className="h-4 w-4 mr-2" />
                  Interests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests && profileData.interests.length > 0 ? (
                    profileData.interests.map((interest: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        {interest}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No interests added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
