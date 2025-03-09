"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import ChatDetailPage with SSR disabled
const ChatDetailPage = dynamic(() => import("@/components/chat/chat-detail-page"), {
  ssr: false,
  loading: () => <div className="p-4">Loading chat conversation...</div>,
})

type SearchParams = { chatId: string }

type PageProps = {
  params: Promise<SearchParams>
}

async function Page({ params }: PageProps) {
  const resolvedParams = await params
  if (!resolvedParams || !resolvedParams.chatId) {
    return <div className="p-4">Invalid chat ID</div>
  }

  return (
    <Suspense fallback={<div className="p-4">Loading chat conversation...</div>}>
      <ChatDetailPage chatId={resolvedParams.chatId as string} />
    </Suspense>
  )
}

export default Page
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/app-shell';
import ChatInterface from '@/components/chat/chat-interface';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

export default function ChatPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  
  const [recipient, setRecipient] = useState<{
    id: string;
    name: string;
    image: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/sign-in');
      return;
    }

    const fetchChatDetails = async () => {
      try {
        const response = await fetch(`/api/chat/${chatId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chat details');
        }
        
        const data = await response.json();
        
        // Find the other participant (not the current user)
        const otherParticipantId = data.participants.find(
          (id: string) => id !== session.user.id
        );
        
        if (otherParticipantId) {
          // Fetch user details
          const userResponse = await fetch(`/api/community/users?ids=${otherParticipantId}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.users && userData.users.length > 0) {
              const user = userData.users[0];
              setRecipient({
                id: user._id,
                name: user.name,
                image: user.profilePic || user.image || '/placeholder-user.jpg'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching chat details:', error);
        toast({
          title: "Error",
          description: "Could not load chat details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatDetails();
  }, [chatId, router, session, status]);

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
            <Skeleton className="h-[60vh]" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <ChatInterface 
            chatId={chatId}
            recipientName={recipient?.name}
            recipientImage={recipient?.image}
          />
        )}
      </div>
    </AppShell>
  );
}
