
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/contexts/auth-context";
import useIsomorphicLayoutEffect from "@/hooks/use-isomorphic-layout-effect";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserData {
  _id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  nativeLanguage?: string;
  learningLanguage?: string;
  lastSeen?: string;
  online?: boolean;
}

function UserCard({ user, onChat, onViewProfile }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image || "/placeholder-user.jpg"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {user.online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{user.name}</h3>
          {user.bio && <p className="text-sm text-muted-foreground line-clamp-2 my-1">{user.bio}</p>}
          <div className="flex flex-wrap gap-1 mt-1">
            {user.nativeLanguage && (
              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                Speaks: {user.nativeLanguage}
              </span>
            )}
            {user.learningLanguage && (
              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                Learning: {user.learningLanguage}
              </span>
            )}
          </div>
          <div className="flex space-x-2 mt-3">
            <Button size="sm" variant="outline" onClick={onChat}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </Button>
            <Button size="sm" variant="outline" onClick={onViewProfile}>
              <User className="h-4 w-4 mr-1" />
              Profile
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function CommunityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/community/users", {
          cache: "no-store"
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.nativeLanguage && user.nativeLanguage.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.learningLanguage && user.learningLanguage.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStartChat = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center">Please sign in to view the community.</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Community</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, language, or interests..."
          className="pl-10"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="online">Online Now</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 h-48 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  onChat={() => handleStartChat(user._id)}
                  onViewProfile={() => handleViewProfile(user._id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your search criteria.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="online">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 h-48 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers
                .filter((user) => user.online)
                .map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    onChat={() => handleStartChat(user._id)}
                    onViewProfile={() => handleViewProfile(user._id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
