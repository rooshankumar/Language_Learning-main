
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SectionLayout } from '@/components/ui/section-layout';
import { ProfileDashboard } from '@/components/profile/profile-dashboard';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUserData(data.user);
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchUserData();
    } else if (status === 'unauthenticated') {
      router.push('/sign-in');
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SectionLayout 
      title="My Profile" 
      description="View and manage your profile information" 
      showAvatar={true}
    >
      {userData ? (
        <div className="space-y-8">
          <ProfileDashboard user={userData} />
          <div className="flex justify-end">
            <Button onClick={() => router.push('/profile/edit')}>
              Edit Profile
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p>Could not load profile data. Please try again later.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.refresh()}>
            Retry
          </Button>
        </div>
      )}
    </SectionLayout>
  );
}
