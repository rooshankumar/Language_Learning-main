
import { Metadata } from "next";
import { UserList } from "@/components/community/user-list";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Community",
  description: "Connect with other language learners",
};

export default function CommunityPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Language Learning Community</h1>
        <p className="text-muted-foreground">
          Connect with other learners, find language partners, and practice together.
        </p>
      </div>

      <UserList />
    </AppShell>
  );
}
