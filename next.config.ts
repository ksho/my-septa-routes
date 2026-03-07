import type { NextConfig } from "next";

// When NEXT_MOBILE_EXPORT=1 (set by `npm run build:mobile`), produce a static
// export in ./out that Capacitor bundles into the iOS/Android app.
// API routes are excluded from the export and continue to run on Vercel.
const isMobileExport = process.env.NEXT_MOBILE_EXPORT === '1';

const nextConfig: NextConfig = {
  ...(isMobileExport && {
    output: 'export',
    images: { unoptimized: true },
  }),
};

export default nextConfig;
