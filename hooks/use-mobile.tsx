
"use client"

import * as React from "react"
import useIsomorphicLayoutEffect from "./use-isomorphic-layout-effect"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with false to avoid hydration mismatch
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

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

  return isMobile
}
