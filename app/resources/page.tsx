"use client";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Download, Search, FileText, Video, Headphones } from "lucide-react";

export default function ResourcesPage() {
  // Mock resources data
  const grammarResources = [
    { id: 1, title: "Complete Guide to Verb Tenses", type: "PDF", size: "2.3 MB", level: "All Levels" },
    { id: 2, title: "Mastering Articles & Prepositions", type: "PDF", size: "1.8 MB", level: "Intermediate" },
    { id: 3, title: "Common Grammar Mistakes to Avoid", type: "PDF", size: "1.2 MB", level: "Beginner" },
  ];

  const vocabularyResources = [
    { id: 1, title: "1000 Essential Words & Phrases", type: "PDF", size: "3.5 MB", level: "Beginner" },
    { id: 2, title: "Business Vocabulary Guide", type: "PDF", size: "2.1 MB", level: "Intermediate" },
    { id: 3, title: "Idioms & Expressions Collection", type: "PDF", size: "1.9 MB", level: "Advanced" },
  ];

  const pronunciationResources = [
    { id: 1, title: "Pronunciation Practice Audio Files", type: "ZIP", size: "15.2 MB", level: "All Levels" },
    { id: 2, title: "Difficult Sounds Guide", type: "PDF", size: "1.6 MB", level: "Intermediate" },
    { id: 3, title: "Intonation & Rhythm Exercises", type: "PDF", size: "2.2 MB", level: "Advanced" },
  ];

  return (
    <AppShell>
      <div className="container py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Learning Resources</h1>
          <p className="text-muted-foreground">Discover materials to improve your language skills</p>
        </div>

        <div className="flex items-center space-x-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resources..."
              className="pl-8"
            />
          </div>
          <Button variant="outline">Resource Type</Button>
          <Button variant="outline">Language</Button>
        </div>

        <Tabs defaultValue="grammar">
          <TabsList className="mb-6">
            <TabsTrigger value="grammar">Grammar</TabsTrigger>
            <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
            <TabsTrigger value="pronunciation">Pronunciation</TabsTrigger>
            <TabsTrigger value="videos">Video Lessons</TabsTrigger>
          </TabsList>

          <TabsContent value="grammar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grammarResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vocabulary">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vocabularyResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pronunciation">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pronunciationResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <div className="relative aspect-video bg-muted">
                  <Video className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground/50" />
                </div>
                <CardHeader>
                  <CardTitle>Conversation Basics</CardTitle>
                  <CardDescription>Learn the fundamentals of conversation</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">Watch Video</Button>
                </CardFooter>
              </Card>

              <Card>
                <div className="relative aspect-video bg-muted">
                  <Video className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground/50" />
                </div>
                <CardHeader>
                  <CardTitle>Pronunciation Tips</CardTitle>
                  <CardDescription>Improve your accent with these techniques</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">Watch Video</Button>
                </CardFooter>
              </Card>

              <Card>
                <div className="relative aspect-video bg-muted">
                  <Video className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground/50" />
                </div>
                <CardHeader>
                  <CardTitle>Grammar Explained</CardTitle>
                  <CardDescription>Clear explanations of complex grammar</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">Watch Video</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Request Resources</CardTitle>
            <CardDescription>
              Don't see what you're looking for? Let us know what resources would help your learning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input placeholder="Describe the resource you need..." />
              <Button>Submit Request</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function ResourceCard({ resource }: { resource: any }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-5 w-5" />;
      case 'ZIP':
        return <Headphones className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {getIcon(resource.type)}
          <span className="ml-2">{resource.title}</span>
        </CardTitle>
        <CardDescription>
          {resource.type} · {resource.size} · {resource.level}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}