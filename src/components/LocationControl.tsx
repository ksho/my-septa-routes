'use client';

import { useEffect, useState } from 'react';

interface LocationControlProps {
  enabled: boolean;
  onToggle: () => void;
  hasError: boolean;
  showRecenter?: boolean;
  onRecenter?: () => void;
}

export function LocationControl({ enabled, onToggle, hasError, showRecenter = false, onRecenter }: LocationControlProps) {
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
    <div className="flex flex-col space-y-2">
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

      {showRecenter && onRecenter && (
        <button
          onClick={onRecenter}
          title="Re-center map on your location"
          className="p-2 rounded-lg shadow-lg backdrop-blur-sm bg-blue-500/65 dark:bg-blue-600/65 hover:bg-blue-600/75 dark:hover:bg-blue-700/75 transition-colors duration-200 flex items-center justify-center"
        >
          <span className="text-sm font-medium text-white whitespace-nowrap">
            Re-center
          </span>
        </button>
      )}
    </div>
  );
}
