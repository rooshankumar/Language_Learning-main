
import { useEffect, useLayoutEffect } from 'react';

// Properly handle SSR by checking if window is defined
const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
