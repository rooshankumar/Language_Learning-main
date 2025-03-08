"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useChat } from "@/hooks/use-chat";

interface UserCardProps {
  user: {
    _id: string;
    name?: string;
    displayName?: string;
    image?: string;
    photoURL?: string;
    bio?: string;
    age?: number;
    nativeLanguage?: string;
    learningLanguage?: string;
    nativeLanguages?: string[];
    learningLanguages?: string[];
    interests?: string[];
    online?: boolean;
  }
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { createOrGetChat } = useChat('', '');

  const handleMessageClick = async () => {
    if (!currentUser || !user._id || !createOrGetChat) return;

    try {
      const chatId = await createOrGetChat(user._id);
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  // Get user's display name (use fallbacks if needed)
  const userName = user.displayName || user.name || "User";

  // Get profile image with fallback
  const profileImage = user.photoURL || user.image || "/placeholder-user.jpg";

  // Get language badges
  const getNativeBadges = () => {
    if (user.nativeLanguages && user.nativeLanguages.length > 0) {
      return user.nativeLanguages.map((lang) => (
        <Badge key={lang} variant="default">{lang}</Badge>
      ));
    } else if (user.nativeLanguage) {
      return <Badge variant="default">{user.nativeLanguage}</Badge>;
    }
    return <Badge variant="outline">Not specified</Badge>;
  };

  const getLearningBadges = () => {
    if (user.learningLanguages && user.learningLanguages.length > 0) {
      return user.learningLanguages.map((lang) => (
        <Badge key={lang} variant="secondary">{lang}</Badge>
      ));
    } else if (user.learningLanguage) {
      return <Badge variant="secondary">{user.learningLanguage}</Badge>;
    }
    return <Badge variant="outline">Not specified</Badge>;
  };

  // Get interests badges
  const getInterestBadges = () => {
    if (!user.interests || user.interests.length === 0) {
      return <Badge variant="outline">No interests listed</Badge>;
    }

    return user.interests.map((interest) => (
      <Badge key={interest} variant="outline">{interest}</Badge>
    ));
  };

  return (
    <Card className="overflow-hidden h-full">
      <div className="aspect-[5/1] bg-gradient-to-r from-primary/20 to-primary/5"></div>
      <CardContent className="p-6 -mt-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-full border-4 border-background overflow-hidden">
            <Image 
              src={profileImage} 
              alt={userName}
              width={80}
              height={80}
              className="aspect-square object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium">{userName}</h3>
            <div className="flex items-center space-x-2">
              {user.age && <span className="text-sm text-muted-foreground">{user.age} years old</span>}
              {user.online && (
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  <span className="text-sm text-muted-foreground">Online</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Speaks</h4>
          <div className="flex flex-wrap gap-2">
            {getNativeBadges()}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Learning</h4>
          <div className="flex flex-wrap gap-2">
            {getLearningBadges()}
          </div>
        </div>

        {user.interests && user.interests.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {getInterestBadges()}
            </div>
          </div>
        )}

        {user.bio && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Bio</h4>
            <p className="text-sm text-muted-foreground">{user.bio}</p>
          </div>
        )}

        <div className="mt-4">
          <Button 
            onClick={handleMessageClick} 
            className="w-full"
            variant="default"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat with {userName.split(' ')[0]}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}