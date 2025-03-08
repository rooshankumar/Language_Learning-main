"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquare, Mail, HelpCircle } from "lucide-react";
import { useState } from "react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: "How do I change my learning language?",
      answer: "You can change your learning language in the Settings page. Navigate to Settings > Learning Preferences and select your new language from the dropdown menu. Your progress and lessons will be updated accordingly."
    },
    {
      question: "Can I use the app offline?",
      answer: "Currently, most features of the app require an internet connection. However, some learning materials like vocabulary lists and grammar guides can be downloaded for offline use through the Resources section."
    },
    {
      question: "How do I connect with language partners?",
      answer: "To find language partners, visit the Community section of the app. There, you can browse users who are native speakers of your target language and are learning your native language. Click on their profile to learn more about them and send a chat request."
    },
    {
      question: "I forgot my password. What should I do?",
      answer: "If you forgot your password, click on the 'Forgot Password' link on the sign-in page. Enter your email address, and we'll send you instructions on how to reset your password."
    },
    {
      question: "How does the streak system work?",
      answer: "Your streak increases by one day each time you complete at least one lesson or practice session within a 24-hour period. If you miss a day, your streak will reset to zero. You can use streak freezes to protect your streak during days when you can't practice."
    },
    {
      question: "Can I delete my account?",
      answer: "Yes, you can delete your account in the Settings page under Account > Delete Account. Please note that this action is permanent and will delete all your learning progress and data."
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <AppShell>
      <div className="container py-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
          <p className="text-muted-foreground">Get answers to common questions and find learning resources</p>
        </div>

        <div className="flex items-center space-x-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search help topics..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">Categories</Button>
        </div>

        <Tabs defaultValue="faq">
          <TabsList className="mb-6">
            <TabsTrigger value="faq">
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Mail className="h-4 w-4 mr-2" />
              Contact Us
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Live Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to common questions about using LinguaConnect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))
                  ) : (
                    <p className="py-4 text-center text-muted-foreground">
                      No results found for "{searchQuery}". Try a different search term or contact us directly.
                    </p>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Send us a message and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input id="email" type="email" placeholder="Your email address" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Subject
                    </label>
                    <Input id="subject" placeholder="What's your message about?" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Describe your issue or question in detail"
                      rows={5}
                    />
                  </div>
                  <Button type="submit" className="w-full md:w-auto">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Live Support Chat</CardTitle>
                <CardDescription>
                  Chat with our support team in real-time for immediate assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 border rounded-md flex flex-col items-center justify-center p-6">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start a Live Chat</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Our support team is available Monday to Friday, 9 AM to 5 PM EST.
                  </p>
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Popular Help Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">Getting Started Guide</span>
                <span className="text-xs text-muted-foreground">Learn the basics of the app</span>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">Account Settings</span>
                <span className="text-xs text-muted-foreground">Manage your profile and preferences</span>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">Troubleshooting</span>
                <span className="text-xs text-muted-foreground">Fix common issues</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}