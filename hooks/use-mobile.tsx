
"use client"

import * as React from "react"
import useIsomorphicLayoutEffect from "./use-isomorphic-layout-effect"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with false to avoid hydration mismatch
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  useIsomorphicLayoutEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Modern API
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
