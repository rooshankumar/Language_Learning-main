
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileDashboard } from "@/components/profile/profile-dashboard";

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileDashboard />
    </div>
  );
}
