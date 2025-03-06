import * as React from "react"

const MOBILE_BREAKPOINT = 768

import useIsomorphicLayoutEffect from "../../hooks/use-isomorphic-layout-effect"

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(false)

  useIsomorphicLayoutEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
