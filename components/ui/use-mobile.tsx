
import * as React from "react"

const MOBILE_BREAKPOINT = 768

import useIsomorphicLayoutEffect from "@/hooks/use-isomorphic-layout-effect"

export function useIsMobile() {
  // Using false as initial state to avoid hydration mismatches
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  useIsomorphicLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
      
      // Modern API
      mql.addEventListener("change", onChange)
      
      // Set initial value
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      
      return () => mql.removeEventListener("change", onChange)
    }
  }, [])

  return isMobile
}
