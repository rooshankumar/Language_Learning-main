
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';

interface SectionLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showAvatar?: boolean;
}

export function SectionLayout({ 
  title, 
  description, 
  children, 
  showAvatar = false 
}: SectionLayoutProps) {
  const { data: session } = useSession();
  
  return (
    <div className="container px-4 py-6 md:py-10 mx-auto max-w-5xl">
      <Card className="w-full shadow-md">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {showAvatar && session?.user && (
            <Avatar className="h-12 w-12">
              <AvatarImage src={session.user.image || "/placeholder-user.jpg"} alt={session.user.name || "User"} />
              <AvatarFallback>{session.user.name?.substring(0, 2) || "U"}</AvatarFallback>
            </Avatar>
          )}
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
