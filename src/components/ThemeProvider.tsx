'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ReactNode, useEffect, useState } from 'react';

interface Props {
  children: ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure DOM is fully ready
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    // Return children without theme provider during SSR/initial hydration
    return <>{children}</>;
  }

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="theme"
    >
      {children}
    </NextThemeProvider>
  );
}