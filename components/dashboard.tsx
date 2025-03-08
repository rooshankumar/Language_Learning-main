
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, BookOpen, Award, Zap, Users, MessageCircle, BookMarked, Settings, HelpCircle, LineChart } from "lucide-react";
import Link from "next/link";

export function Dashboard() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(7); // Mock data
  const [progress, setProgress] = useState(68); // Mock data

  // Recommended lessons mock data
  const recommendedLessons = [
    { id: 1, title: "Past Tense Mastery", duration: "15 min", level: "Intermediate", category: "Grammar" },
    { id: 2, title: "Common Phrases in Conversation", duration: "10 min", level: "Beginner", category: "Speaking" },
    { id: 3, title: "Food Vocabulary Expansion", duration: "20 min", level: "Intermediate", category: "Vocabulary" },
  ];

  // Recent activities mock data
  const recentActivities = [
    { id: 1, title: "Completed Pronunciation Lesson", time: "2 hours ago", xp: 25 },
    { id: 2, title: "Practiced with Anna", time: "Yesterday", xp: 40 },
    { id: 3, title: "Vocabulary Quiz", time: "3 days ago", xp: 15 },
  ];

  // Blog posts mock data
  const blogPosts = [
    { id: 1, title: "5 Tips for Improving Your Accent", author: "Dr. Sofia Martinez", date: "3 days ago", readTime: "5 min" },
    { id: 2, title: "How to Build a Daily Language Routine", author: "Alex Chen", date: "1 week ago", readTime: "7 min" },
    { id: 3, title: "The Science of Language Acquisition", author: "Prof. James Wilson", date: "2 weeks ago", readTime: "10 min" },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  Hello, {user?.displayName || "Learner"}!
                </h1>
                <p className="text-muted-foreground mt-1">Ready to continue your language journey?</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-2xl">
                    {streak}
                  </div>
                  <Badge className="absolute -bottom-2 right-0 bg-indigo-500">
                    <Zap className="w-3 h-3 mr-1" />
                    Streak
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:w-1/3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Daily Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Today's progress</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {progress < 100 
                  ? `${100 - progress}% more to reach your daily goal` 
                  : "You've completed today's goal! 🎉"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended lessons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BookOpen className="w-5 h-5 mr-2" />
                Recommended for You
              </CardTitle>
              <CardDescription>
                Personalized lessons based on your learning pattern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendedLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          {lesson.category}
                        </Badge>
                        <h3 className="font-medium">{lesson.title}</h3>
                      </div>
                      <div className="flex mt-1 text-sm text-muted-foreground">
                        <span className="mr-3">{lesson.duration}</span>
                        <span>{lesson.level}</span>
                      </div>
                    </div>
                    <Button size="sm">
                      Start Lesson
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Lessons
              </Button>
            </CardFooter>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <CalendarDays className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border-b last:border-0">
                    <div>
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                    <Badge variant="secondary">+{activity.xp} XP</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
                  <Link href="/chat">
                    <MessageCircle className="w-5 h-5 mb-1" />
                    <span>Practice Chat</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
                  <Link href="/community">
                    <Users className="w-5 h-5 mb-1" />
                    <span>Community</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
                  <Link href="/profile">
                    <Award className="w-5 h-5 mb-1" />
                    <span>Achievements</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
                  <Link href="/progress">
                    <LineChart className="w-5 h-5 mb-1" />
                    <span>Progress</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Blog Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BookMarked className="w-5 h-5 mr-2" />
                Learning Blog
              </CardTitle>
              <CardDescription>
                Tips and insights for language learners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blogPosts.map((post) => (
                  <div key={post.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <h3 className="font-medium hover:text-primary cursor-pointer">{post.title}</h3>
                    <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                      <span>By {post.author}</span>
                      <span>{post.readTime} read</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full">
                View All Articles
              </Button>
            </CardFooter>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/resources/grammar">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Grammar Guides
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/resources/vocabulary">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Vocabulary Lists
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/resources/pronunciation">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Pronunciation Tools
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mt-12">
        <Link href="/help" className="hover:text-primary">Help & Support</Link>
        <Link href="/faq" className="hover:text-primary">FAQ</Link>
        <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
        <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
      </div>
    </div>
  );
}
