"use client";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare } from "lucide-react";
import Chat from "@/components/chat/Chat";

export default function ChatPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const userId = searchParams?.get("userId");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // If a userId is provided in the URL, fetch that user's data
    if (userId) {
      const fetchUser = async () => {
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            setSelectedUser(userData);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      };
      fetchUser();
    }
  }, [userId]);

  return (
    <AppShell>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold flex items-center">
                <MessageSquare className="mr-2 h-6 w-6" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="w-full">
                  <Chat />
                </TabsContent>

                <TabsContent value="contacts" className="space-y-4">
                  <p>Your contacts will appear here.</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}