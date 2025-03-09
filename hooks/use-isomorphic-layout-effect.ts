
import { useLayoutEffect, useEffect } from 'react'

// Use useLayoutEffect in browser and useEffect during SSR
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
