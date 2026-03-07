import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.septalive.app',
  appName: 'SEPTA Live',
  // Points to the static export built by `npm run build:mobile`
  webDir: 'out',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      // iOS: NSLocationWhenInUseUsageDescription is set in Info.plist
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#0066CC',
    },
  },
  ios: {
    // contentInset ensures content isn't hidden by the notch or home indicator
    contentInset: 'automatic',
  },
};

export default config;
