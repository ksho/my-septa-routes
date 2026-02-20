'use client';

import { useState } from 'react';

interface BannerMessage {
  show: boolean;
  text: string;
}

export function PermalinkButton() {
  const [bannerMessage, setBannerMessage] = useState<BannerMessage>({ show: false, text: '' });

  const handleCopyPermalink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setBannerMessage({ show: true, text: 'Permalink with your routes copied to clipboard!' });

      // Hide banner after 3 seconds
      setTimeout(() => {
        setBannerMessage({ show: false, text: '' });
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setBannerMessage({ show: true, text: 'Failed to copy to clipboard' });
      setTimeout(() => {
        setBannerMessage({ show: false, text: '' });
      }, 3000);
    }
  };

  return (
    <>
      <button
        onClick={handleCopyPermalink}
        title="Copy permalink with your routes"
        className="flex-1 h-10 rounded-lg shadow-lg backdrop-blur-sm bg-white/65 dark:bg-gray-800/65 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors duration-200 text-xl flex items-center justify-center"
      >
        🔗
      </button>

      {/* Success Banner */}
      {bannerMessage.show && (
        <>
          <style jsx>{`
            @keyframes bannerAnimation {
              0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.9);
              }
              15% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
              85% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
              100% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(1.8);
              }
            }
            .banner-animate {
              animation: bannerAnimation 3s ease-in-out forwards;
            }
          `}</style>
          <div
            className="fixed top-1/2 left-1/2 z-[2000] px-6 py-3 rounded-lg shadow-lg banner-animate"
            style={{ backgroundColor: 'rgba(22, 163, 74, 0.75)' }}
          >
            <p className="text-white text-sm font-medium whitespace-nowrap">
              {bannerMessage.text}
            </p>
          </div>
        </>
      )}
    </>
  );
}
