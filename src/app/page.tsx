'use client';

import dynamic from 'next/dynamic';
import { ThemeToggle } from '@/components/ThemeToggle';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-lg">Loading SEPTA Transit Map...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="w-full h-screen">
      <div className="absolute top-4 left-4 z-[1000] bg-white/65 dark:bg-gray-800/65 backdrop-blur-sm p-3 rounded-lg shadow-lg">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">SEPTA LIVE</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">By Karl Shouler</p>
      </div>
      <div className="absolute top-4 right-4 z-[1000]">
        <ThemeToggle />
      </div>
      <Map />
    </div>
  );
}
