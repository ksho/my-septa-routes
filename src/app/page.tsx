'use client';

import dynamic from 'next/dynamic';

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
      <div className="absolute top-4 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg">
        <h1 className="text-lg font-bold">SEPTA Real-Time Transit</h1>
        <p className="text-sm text-gray-600">Routes: 57, 47, 42, 9, 12, 21</p>
      </div>
      <Map />
    </div>
  );
}
