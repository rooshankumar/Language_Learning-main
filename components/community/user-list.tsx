
"use client";

import { useState, useEffect } from "react";
import UserCard from "./user-card";
import { useRouter } from "next/navigation";

interface User {
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

export function UserList({ searchQuery }: { searchQuery: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.nativeLanguage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.learningLanguage?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const handleStartChat = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
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
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No users found matching your search criteria.</p>
      </div>
    );
  }

  return (
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
  );
}
