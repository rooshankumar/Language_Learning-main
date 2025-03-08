"use client"

import { redirect } from "next/navigation";
import { useAuth } from "@/contexts/auth-context"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Users, MessageSquare } from "lucide-react"
import { ProfileDashboard } from "@/components/profile-dashboard"

export default function Home() {
  redirect("/community");
  return null;
}