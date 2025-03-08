
"use client";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookMarked, Search, User, Calendar, Clock } from "lucide-react";

export default function BlogPage() {
  // Mock blog data
  const featuredPosts = [
    { 
      id: 1, 
      title: "How to Build an Effective Language Learning Routine",
      excerpt: "Discover strategies for creating a daily language practice that sticks and delivers results...",
      author: "Maria Rodriguez",
      date: "May 12, 2023",
      readTime: "8 min read",
      category: "Learning Strategies",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80"
    },
    { 
      id: 2, 
      title: "The Science of Language Acquisition: What Research Tells Us",
      excerpt: "Learn about the latest findings in linguistics research and how they can improve your learning...",
      author: "Dr. James Chen",
      date: "April 28, 2023",
      readTime: "12 min read",
      category: "Research",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
    },
    { 
      id: 3, 
      title: "5 Common Mistakes Language Learners Make (And How to Avoid Them)",
      excerpt: "Are you making these errors in your language learning journey? Learn how to identify and fix them...",
      author: "Sofia Patel",
      date: "March 15, 2023",
      readTime: "6 min read",
      category: "Tips & Tricks",
      image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
    },
    { 
      id: 4, 
      title: "Language Immersion at Home: Creating an Immersive Environment",
      excerpt: "You don't need to travel abroad to immerse yourself in a language. Here's how to do it from home...",
      author: "Thomas Meyer",
      date: "February 22, 2023",
      readTime: "9 min read",
      category: "Immersion",
      image: "https://images.unsplash.com/photo-1565022536102-f7645c84354a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1734&q=80"
    }
  ];

  const categories = [
    "All Topics",
    "Learning Strategies",
    "Grammar Tips",
    "Vocabulary Building",
    "Speaking Practice",
    "Cultural Insights",
    "Learning Tools",
    "Success Stories"
  ];

  return (
    <AppShell>
      <div className="container py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Language Learning Blog</h1>
          <p className="text-muted-foreground">Expert articles, tips, and strategies to improve your language skills</p>
        </div>

        <div className="flex items-center space-x-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles..."
              className="pl-8"
            />
          </div>
          <Button variant="outline">Categories</Button>
        </div>

        {/* Featured Article */}
        <Card className="overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2 h-64 md:h-auto relative bg-muted">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${featuredPosts[0].image})` }}
              />
            </div>
            <div className="md:w-1/2 p-6 md:p-8">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  Featured
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-3">{featuredPosts[0].title}</h2>
              <p className="text-muted-foreground mb-4">{featuredPosts[0].excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {featuredPosts[0].author}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {featuredPosts[0].date}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {featuredPosts[0].readTime}
                </div>
              </div>
              <Button>Read Article</Button>
            </div>
          </div>
        </Card>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <Button 
              key={index} 
              variant={index === 0 ? "default" : "outline"} 
              size="sm"
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Blog Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPosts.slice(1).map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <div 
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${post.image})` }}
              />
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-muted rounded-full">
                    {post.category}
                  </span>
                </div>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {post.author}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {post.readTime}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full">Read More</Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <Button variant="outline">Load More Articles</Button>
        </div>

        {/* Newsletter Signup */}
        <Card className="bg-muted/50 mt-12">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 py-8">
            <div>
              <h3 className="text-xl font-bold mb-2">Subscribe to our Newsletter</h3>
              <p className="text-muted-foreground">Get the latest language learning tips and resources directly in your inbox</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Input placeholder="Enter your email" className="md:w-64" />
              <Button>Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
