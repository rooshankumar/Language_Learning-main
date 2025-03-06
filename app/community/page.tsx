'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Use dynamic import with no SSR to prevent Firebase Auth errors during build
const CommunityPage = dynamic(() => import('@/components/community/community-page'), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4">Loading community...</div>}>
      <CommunityPage />
    </Suspense>
  );
}