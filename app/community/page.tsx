"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { UserList } from "@/components/community/user-list";
import { UsersLoading } from "@/components/community/users-loading";
import { CommunityHeader } from "@/components/community/community-header";
import { useAuth } from "@/contexts/auth-context";

export default function CommunityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [loading, user, router]);

  return (
    <div className="container mx-auto py-8 px-4">
      <CommunityHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Suspense fallback={<UsersLoading />}>
        <UserList searchQuery={searchQuery} />
      </Suspense>
    </div>
  );
}