
"use client"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-900/40 to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover opacity-20"
        >
          <source src="/assets/92718-637669246_medium.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Removed overlay to allow video only */}
      </div>

      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">Enter your email address to reset your password</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Remember your password?{" "}
            <Link href="/sign-in" className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
