
import { useLayoutEffect, useEffect } from 'react';

// Use useLayoutEffect in browser environments, useEffect on the server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' 
  ? useLayoutEffect 
  : useEffect;

export default useIsomorphicLayoutEffect;
