
"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  size?: "small" | "medium" | "large"
  className?: string
}

export function Spinner({ size = "medium", className }: SpinnerProps) {
  const sizeClass = 
    size === "small" ? "h-4 w-4" : 
    size === "large" ? "h-8 w-8" :
    "h-6 w-6"
  
  return (
    <Loader2 className={cn("animate-spin text-pink-600", sizeClass, className)} />
  )
}
