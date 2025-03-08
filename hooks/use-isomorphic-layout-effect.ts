
import { useEffect, useLayoutEffect } from 'react';

// This hook safely handles useLayoutEffect during SSR
const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
