
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/community");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to community page...</p>
    </div>
  );
}
