
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

export function WelcomeBanner() {
  const { user } = useAuth()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  
  useEffect(() => {
    // Check if this is first visit after signup
    const checkFirstVisit = async () => {
      try {
        if (!user) return
        
        const { doc, getDoc, updateDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setIsFirstVisit(userData.isNewUser === true)
          
          // If this was the first visit, update the flag
          if (userData.isNewUser === true) {
            await updateDoc(userDocRef, {
              isNewUser: false
            })
          }
        }
      } catch (error) {
        console.error("Error checking first visit status:", error)
      }
    }
    
    checkFirstVisit()
    
    // Check local storage to see if banner was dismissed before
    const bannerDismissed = localStorage.getItem("welcome_banner_dismissed") === "true"
    if (bannerDismissed) {
      setIsVisible(false)
    }
  }, [user])
  
  const dismissBanner = () => {
    setIsVisible(false)
    localStorage.setItem("welcome_banner_dismissed", "true")
  }
  
  if (!isVisible) return null
  
  return (
    <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {isFirstVisit 
                ? "Welcome to Language Partners!" 
                : `Welcome back, ${user?.displayName || "language learner"}!`}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isFirstVisit
                ? "Your journey to language mastery starts now. Here's what you can do:"
                : "Continue your language learning journey with these options:"}
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => router.push("/community")}
                variant="default"
              >
                Find Language Partners
              </Button>
              
              {isFirstVisit && (
                <Button 
                  onClick={() => router.push("/profile")}
                  variant="outline"
                >
                  Complete Your Profile
                </Button>
              )}
              
              {!isFirstVisit && (
                <Button 
                  onClick={() => router.push("/chat")}
                  variant="outline"
                >
                  Continue Conversations
                </Button>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={dismissBanner} 
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
