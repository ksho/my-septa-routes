'use client';

import { useEffect, useState } from 'react';

interface NearbyRoutesControlProps {
  enabled: boolean;
  onToggle: () => void;
  disabled: boolean;
  nearbyCount: number;
}

export function NearbyRoutesControl({ enabled, onToggle, disabled, nearbyCount }: NearbyRoutesControlProps) {
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
        <div className="w-32 h-8" />
      </div>
    );
  }

  const title = disabled
    ? 'Enable location first'
    : enabled
    ? 'Hide nearby routes'
    : 'Show nearby routes';

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg shadow-lg backdrop-blur-sm transition-colors duration-200 flex items-center space-x-2 ${
        disabled
          ? 'bg-gray-100/65 dark:bg-gray-700/65 cursor-not-allowed opacity-60'
          : 'bg-white/65 dark:bg-gray-800/65 hover:bg-white/80 dark:hover:bg-gray-700/80'
      }`}
    >
      <input
        type="checkbox"
        checked={enabled}
        onChange={() => {}} // Handled by button onClick
        disabled={disabled}
        className="w-4 h-4 accent-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Toggle nearby routes"
      />
      <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
        🔍 Nearby ({nearbyCount})
      </span>
    </button>
  );
}
