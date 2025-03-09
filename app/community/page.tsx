import { Metadata } from "next"
import { UserList } from "@/components/community/user-list"

export const metadata: Metadata = {
  title: "Community",
  description: "Connect with other language learners",
}

export default function CommunityPage() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Language Learning Community</h1>
        <p className="text-muted-foreground">
          Connect with other learners, find language partners, and practice together.
        </p>
      </div>

      <UserList />
    </div>
  )
}