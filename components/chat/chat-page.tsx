
"use client";

import { AppShell } from "@/components/app-shell";
import { ChatList } from "@/components/chat/chat-list";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Users } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Conversations</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/community")}>
              <Users className="h-4 w-4 mr-2" />
              Find Partners
            </Button>
          </div>
        </div>
        
        <ChatList />
        
        <div className="mt-6 text-center">
          <p className="text-muted-foreground mb-4">
            Start practicing with language partners from around the world
          </p>
          <Button onClick={() => router.push("/community")}>
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Find Language Partners
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
