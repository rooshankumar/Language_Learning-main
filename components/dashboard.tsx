"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, BookOpen, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WelcomeBanner } from "./dashboard/welcome-banner";

export function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Generate current user data
  const userName = user?.displayName || "Language Learner";
  const currentDate = new Date();

  // Generate realistic data (would be replaced with real data from database)
  const practiceStreak = Math.floor(Math.random() * 15) + 1;
  const vocabularyWords = Math.floor(Math.random() * 200) + 50;
  const weeklyIncrement = Math.floor(Math.random() * 30) + 5;
  const activePartners = Math.floor(Math.random() * 5) + 1;

  // Random partner names for more realism
  const partnerNames = [
    "Emma Thompson", "Miguel Hernandez", "Sophia Chen",
    "Hiroshi Tanaka", "Fatima Al-Farsi", "Pierre Dubois",
    "Ana Silva", "Raj Patel", "Isabella Rodriguez"
  ];

  // Last conversation times
  const conversationTimes = [
    "Just now",
    "10 minutes ago",
    "2 hours ago",
    "Yesterday",
    "2 days ago"
  ];

  // Upcoming lessons
  const upcomingLessons = [
    {
      title: "Conversation Practice",
      teacher: partnerNames[Math.floor(Math.random() * partnerNames.length)],
      time: `Tomorrow, ${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? '30' : '00'} ${Math.random() > 0.5 ? 'AM' : 'PM'}`
    },
    {
      title: "Vocabulary Builder",
      teacher: partnerNames[Math.floor(Math.random() * partnerNames.length)],
      time: `${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)]}, ${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? '30' : '00'} ${Math.random() > 0.5 ? 'AM' : 'PM'}`
    }
  ];

  return (
    <div className="py-6">
      <WelcomeBanner />

      <h1 className="text-3xl font-bold mb-2">
        {currentDate.getHours() < 12
          ? "Good morning"
          : currentDate.getHours() < 18
            ? "Good afternoon"
            : "Good evening"}, {userName}!
      </h1>
      <p className="text-muted-foreground mb-8">Here's your language learning overview.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Practice Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{practiceStreak} days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it going!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vocabulary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vocabularyWords} words</div>
            <p className="text-xs text-muted-foreground mt-1">+{weeklyIncrement} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePartners}</div>
            <p className="text-xs text-muted-foreground mt-1">Find more in community</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingLessons[0].time.split(",")[0]}</div>
            <p className="text-xs text-muted-foreground mt-1">{upcomingLessons[0].title}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Conversations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Continue practicing with your language partners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {partnerNames.slice(0, 3).map((partner, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {partner.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-medium">{partner}</h3>
                      <p className="text-xs text-muted-foreground">{conversationTimes[i]}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/community")}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Find Partners
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/chat">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  View All Conversations
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Helpful shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/community">
                  <Users className="w-4 h-4 mr-2" />
                  Find Language Partners
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/profile">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Update Profile
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/chat">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  My Conversations
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/settings">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Practice
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}