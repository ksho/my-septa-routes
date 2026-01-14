'use client';

import { useEffect, useState } from 'react';

interface LocationControlProps {
  enabled: boolean;
  onToggle: () => void;
  hasError: boolean;
}

export function LocationControl({ enabled, onToggle, hasError }: LocationControlProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="p-2 rounded-lg bg-white/65 dark:bg-gray-800/65 shadow-lg backdrop-blur-sm"
        suppressHydrationWarning={true}
      >
        <div className="w-20 h-8" />
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      title={enabled ? 'Disable location tracking' : 'Enable location tracking'}
      className={`p-2 rounded-lg shadow-lg backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors duration-200 flex items-center space-x-2 ${
        hasError
          ? 'bg-red-100/65 dark:bg-red-900/65'
          : 'bg-white/65 dark:bg-gray-800/65'
      }`}
    >
      <input
        type="checkbox"
        checked={enabled}
        onChange={() => {}} // Handled by button onClick
        className="w-4 h-4 accent-blue-500"
        aria-label="Toggle location tracking"
      />
      <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
        ⚓️ Location
      </span>
    </button>
  );
}
