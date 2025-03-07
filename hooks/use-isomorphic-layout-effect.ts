
import { useLayoutEffect, useEffect } from 'react';

/**
 * A hook that provides useLayoutEffect on the client
 * and useEffect during SSR to avoid React hydration warnings
 */
const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
