
"use client"

import React from 'react'
import useIsomorphicLayoutEffect from '@/hooks/use-isomorphic-layout-effect'

export function ExampleComponent() {
  // Use this instead of useLayoutEffect directly
  useIsomorphicLayoutEffect(() => {
    // Your layout effect code here
  }, [])
  
  return <div>Example Component</div>
}
