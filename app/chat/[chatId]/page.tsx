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
