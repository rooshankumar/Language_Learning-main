"use client";

import { Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, BarChart } from "lucide-react";

export default function ProgressPage() {
  // Mock data
  const [weeklyProgress] = useState([
    { day: "Mon", value: 85 },
    { day: "Tue", value: 65 },
    { day: "Wed", value: 90 },
    { day: "Thu", value: 75 },
    { day: "Fri", value: 30 },
    { day: "Sat", value: 60 },
    { day: "Sun", value: 45 },
  ]);

  const badges = [
    { id: 1, title: "7-Day Streak", achieved: true, icon: "🔥" },
    { id: 2, title: "Vocabulary Master", achieved: true, icon: "📚" },
    { id: 3, title: "Grammar Guru", achieved: true, icon: "🧠" },
    { id: 4, title: "Conversation Pro", achieved: false, icon: "🗣️" },
    { id: 5, title: "Pronunciation Expert", achieved: false, icon: "🎯" },
    { id: 6, title: "Cultural Explorer", achieved: false, icon: "🌎" },
  ];

  const skills = [
    { name: "Speaking", progress: 65 },
    { name: "Listening", progress: 80 },
    { name: "Reading", progress: 75 },
    { name: "Writing", progress: 60 },
    { name: "Vocabulary", progress: 70 },
    { name: "Grammar", progress: 55 },
  ];

  return (
    <AppShell>
      <div className="container py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Learning Progress</h1>
          <p className="text-muted-foreground">Track your language learning journey and accomplishments</p>
        </div>

        <div className="flex items-center space-x-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search activities..."
              className="pl-8"
            />
          </div>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Filter by Date
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChart className="w-5 h-5 mr-2" />
                    Weekly Activity
                  </CardTitle>
                  <CardDescription>Your learning activity over the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {weeklyProgress.map((day) => (
                      <div key={day.day} className="flex flex-col items-center">
                        <div
                          className="w-12 bg-primary rounded-t-md transition-all duration-500 ease-in-out"
                          style={{ height: `${day.value * 0.6}%` }}
                        ></div>
                        <div className="mt-2 text-sm">{day.day}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Streak</CardTitle>
                  <CardDescription>Days of consistent practice</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary text-5xl font-bold">
                      7
                    </div>
                    <Badge className="absolute -bottom-2 right-0 bg-primary">
                      Days
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total XP</CardTitle>
                  <CardDescription>Experience points earned</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-5xl font-bold">
                      350
                    </div>
                    <Badge className="absolute -bottom-2 right-0 bg-amber-500">
                      XP
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Words Learned</CardTitle>
                  <CardDescription>Vocabulary progress</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-5xl font-bold">
                      128
                    </div>
                    <Badge className="absolute -bottom-2 right-0 bg-indigo-500">
                      Words
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="w-5 h-5 mr-2" />
                  Language Skills
                </CardTitle>
                <CardDescription>Your progress across different language skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {skills.map((skill) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{skill.name}</span>
                        <span>{skill.progress}%</span>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((badge) => (
                <Card key={badge.id} className={badge.achieved ? "" : "opacity-50"}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="text-4xl mb-3">{badge.icon}</div>
                      <h3 className="font-bold mb-1">{badge.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        {badge.achieved ? "Achieved" : "Not Yet Achieved"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Learning History
                </CardTitle>
                <CardDescription>Your learning activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center p-6 border border-dashed rounded-lg">
                  <p className="text-muted-foreground text-center">
                    Calendar view with learning activity heatmap would be displayed here. <br />
                    Coming soon in the next update!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}