'use client';

import { useState, useEffect, type ReactNode } from 'react';

/**
 * A component to wrap content that causes hydration errors.
 * It delays rendering its children until the component has mounted on the client,
 * ensuring that server-rendered and client-rendered markup match.
 */
export function SafeHydrate({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? <>{children}</> : null;
}
