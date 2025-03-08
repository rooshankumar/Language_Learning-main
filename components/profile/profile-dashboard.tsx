"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface ProfileDashboardProps {
  user: {
    name?: string;
    email?: string;
    profilePicture?: string;
    bio?: string;
    age?: number;
    nativeLanguage?: string;
    learningLanguages?: string[];
    interests?: string[];
  };
}

export function ProfileDashboard({ user }: ProfileDashboardProps) {
  const formatLanguage = (lang: string) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-primary/20">
          <Image
            src={user.profilePicture || "/placeholder-user.jpg"}
            alt={user.name || "User"}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold">{user.name || "Anonymous User"}</h2>
          <p className="text-muted-foreground">{user.email}</p>

          {user.age && (
            <p className="mt-1">
              <span className="font-medium">Age:</span> {user.age}
            </p>
          )}

          {user.nativeLanguage && (
            <p className="mt-1">
              <span className="font-medium">Native language:</span> {formatLanguage(user.nativeLanguage)}
            </p>
          )}

          {user.bio && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground italic">"{user.bio}"</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-3">Languages I'm Learning</h3>
            <div className="flex flex-wrap gap-2">
              {user.learningLanguages && user.learningLanguages.length > 0 ? (
                user.learningLanguages.map((language, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {formatLanguage(language)}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No languages added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-3">My Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1">
                    {formatLanguage(interest)}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No interests added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}