
"use client";

import { useEffect, useState } from "react";
import { Chat } from "./Chat";
import { SectionLayout } from "@/components/ui/section-layout";

export function ChatWrapper() {
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to handle client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <SectionLayout title="Chat" description="Connect with other learners">
      {isClient ? <Chat /> : <div>Loading chat...</div>}
    </SectionLayout>
  );
}
