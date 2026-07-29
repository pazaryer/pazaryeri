/** @type {import('expo/config').ExpoConfig} */
const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

const PUBLISHER = '8045800087063412';

function loadAdMobAppIds() {
  const fromEnv = {
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim(),
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID?.trim(),
  };
  if (fromEnv.android && fromEnv.ios) {
    return { androidAppId: fromEnv.android, iosAppId: fromEnv.ios };
  }

  const configPath = path.join(__dirname, 'config', 'admob.ids.json');
  if (fs.existsSync(configPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (raw.androidAppId && raw.iosAppId) {
        return { androidAppId: raw.androidAppId, iosAppId: raw.iosAppId };
      }
    } catch {
      /* fall through */
    }
  }

  const profile = process.env.EAS_BUILD_PROFILE ?? '';
  const isRelease = profile === 'production' || profile === 'preview';
  if (isRelease) {
    console.warn(
      `[AdMob] Üretim build: config/admob.ids.json veya EXPO_PUBLIC_ADMOB_* env ayarlayın (pub-${PUBLISHER}).`,
    );
  }

  return {
    androidAppId: `ca-app-pub-${PUBLISHER}~8727412358`,
    iosAppId: `ca-app-pub-${PUBLISHER}~8727412358`,
  };
}

function patchPlugins(plugins, admobIds) {
  return plugins.map((entry) => {
    if (Array.isArray(entry) && entry[0] === 'react-native-google-mobile-ads') {
      return [
        'react-native-google-mobile-ads',
        {
          ...entry[1],
          androidAppId: admobIds.androidAppId,
          iosAppId: admobIds.iosAppId,
        },
      ];
    }
    return entry;
  });
}

module.exports = () => {
  const admobIds = loadAdMobAppIds();
  const expo = appJson.expo;

  return {
    ...expo,
    version: expo.version ?? '1.1.0',
    android: {
      ...expo.android,
      versionCode: 2,
      permissions: [
        ...(expo.android.permissions ?? []).filter((p) => p !== 'android.permission.RECORD_AUDIO'),
        'com.google.android.gms.permission.AD_ID',
      ],
      blockedPermissions: [
        ...(expo.android.blockedPermissions ?? []),
        'android.permission.RECORD_AUDIO',
      ],
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.pazaryerim',
    },
    ios: {
      ...expo.ios,
      config: {
        ...(expo.ios?.config ?? {}),
        usesNonExemptEncryption: false,
      },
    },
    plugins: patchPlugins(expo.plugins, admobIds),
    extra: {
      ...expo.extra,
      admob: admobIds,
      privacyPolicyUrl: 'https://pazaryeri0.web.app/privacy',
      termsUrl: 'https://pazaryeri0.web.app/terms',
    },
  };
};
