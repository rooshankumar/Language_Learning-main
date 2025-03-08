"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";

export function ProfileDashboard({ user }) {
  const router = useRouter();

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <p>No profile data available.</p>
        </CardContent>
      </Card>
    );
  }

  // Format the languages as comma-separated list
  const nativeLanguagesFormatted = Array.isArray(user.nativeLanguages) && user.nativeLanguages.length > 0
    ? user.nativeLanguages.join(', ')
    : user.nativeLanguage || 'Not specified';

  const learningLanguagesFormatted = Array.isArray(user.learningLanguages) && user.learningLanguages.length > 0
    ? user.learningLanguages.join(', ')
    : user.learningLanguage || 'Not specified';

  // Format the proficiency
  const proficiencyFormatted = user.proficiency ? 
    user.proficiency.charAt(0).toUpperCase() + user.proficiency.slice(1) : 
    'Beginner';

  return (
    <Card className="w-full">
      <CardHeader className="relative pb-0">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="rounded-full overflow-hidden w-20 h-20 border-2 border-muted-foreground">
            <img 
              src={user.profilePic || user.image || '/placeholder-user.jpg'} 
              alt={user.displayName || user.name || 'User'} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <CardTitle className="text-2xl">
              {user.displayName || user.name || 'Anonymous User'}
            </CardTitle>
            <CardDescription className="mt-1">
              {user.email}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {user.bio && (
          <div className="mb-6">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Bio</h3>
            <p className="text-sm">{user.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.age && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Age</h3>
              <p className="text-sm">{user.age}</p>
            </div>
          )}

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Native Language(s)</h3>
            <p className="text-sm">{nativeLanguagesFormatted}</p>
          </div>

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Learning</h3>
            <p className="text-sm">{learningLanguagesFormatted}</p>
          </div>

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Proficiency</h3>
            <p className="text-sm">{proficiencyFormatted}</p>
          </div>
        </div>

        {Array.isArray(user.interests) && user.interests.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, index) => (
                <Badge key={index} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}