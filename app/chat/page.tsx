'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Use dynamic import with no SSR to prevent Firebase Auth errors during build
const ChatPage = dynamic(() => import('@/components/chat/chat-page'), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4">Loading chat...</div>}>
      <ChatPage />
    </Suspense>
  );
}