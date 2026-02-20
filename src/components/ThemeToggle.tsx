'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with same dimensions to prevent layout shift
    return (
      <button
        className="flex-1 h-10 rounded-lg bg-white/65 shadow-lg backdrop-blur-sm text-xl flex items-center justify-center"
        suppressHydrationWarning={true}
      >
        🌙
      </button>
    );
  }

  const toggleTheme = () => {
    if (theme === 'system') {
      // If currently system, switch to light or dark based on current system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'light' : 'dark');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'dark') {
      return '🌙'; // Moon for dark mode
    } else if (theme === 'light') {
      return '☀️'; // Sun for light mode
    } else {
      // System mode - show based on current system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isDark ? '🌙' : '☀️';
    }
  };

  const getTooltip = () => {
    if (theme === 'dark') {
      return 'Switch to light mode';
    } else if (theme === 'light') {
      return 'Switch to dark mode';
    } else {
      return 'Currently following system preference';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      title={getTooltip()}
      className="flex-1 h-10 rounded-lg bg-white/65 dark:bg-gray-800/65 shadow-lg backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors duration-200 text-xl flex items-center justify-center"
    >
      {getIcon()}
    </button>
  );
}