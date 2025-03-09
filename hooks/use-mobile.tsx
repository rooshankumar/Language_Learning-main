
"use client"

import * as React from "react"
import useIsomorphicLayoutEffect from "./use-isomorphic-layout-effect"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with null to avoid hydration mismatch
  const [isMobile, setIsMobile] = React.useState<boolean | null>(null)

  useIsomorphicLayoutEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Set initial value
    checkMobile()
    
    // Add event listener
    window.addEventListener("resize", checkMobile)
    
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Return false during SSR and initial render
  return isMobile ?? false
}
