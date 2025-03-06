"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Dashboard } from "@/components/dashboard"
import { useAuth } from "@/contexts/auth-context"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Firestore } from "firebase/firestore"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.uid) {
      // Async function to check user onboarding status
      const checkOnboardingStatus = async () => {
        try {
          const { doc, getDoc } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")

          if (!db) {
            console.error("Firestore instance is not initialized")
            return
          }

          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)
          const userData = userDoc.exists() ? userDoc.data() : null

          // If user has no languages set, redirect to onboarding
          if (!userData?.nativeLanguages?.length || !userData?.learningLanguages?.length) {
            router.push("/onboarding")
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error)
        }
      }

      checkOnboardingStatus()
    }
  }, [user, loading, router])

  // If user is not authenticated, show landing page
  if (!user && !loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <AnimatedBackground>
          <div className="container flex flex-col items-center justify-center min-h-screen text-center z-10 relative">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Connect and Learn With <span className="text-primary">Language Partners</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-muted-foreground">
              Practice languages with native speakers, make friends around the world, and accelerate your learning journey.
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg">
                <Link href="/sign-up">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </AnimatedBackground>
      </div>
    )
  }

  return <AppShell>{user && <Dashboard />}</AppShell>
}