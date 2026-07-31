/** @type {import('expo/config').ExpoConfig} */
const fs = require('fs');
const path = require('path');

const appJson = require('./app.json');

function loadAdMobAppIds() {
  const fromEnv = {
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim(),
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID?.trim(),
  };
  if (fromEnv.android) {
    return {
      androidAppId: fromEnv.android,
      iosAppId: fromEnv.ios || fromEnv.android,
    };
  }

  const configPath = path.join(__dirname, 'config', 'admob.ids.json');
  if (fs.existsSync(configPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const androidAppId = raw.androidAppId?.trim();
      const iosAppId = raw.iosAppId?.trim();
      if (androidAppId) {
        return { androidAppId, iosAppId: iosAppId || androidAppId };
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

function patchPlugins(plugins, admobIds) {
  return plugins
    .filter((entry) => !(Array.isArray(entry) && entry[0] === 'react-native-google-mobile-ads'))
    .concat([
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: admobIds.androidAppId,
          iosAppId: admobIds.iosAppId,
          userTrackingUsageDescription: 'Size daha uygun reklamlar gösterebilmek için.',
        },
      ],
    ]);
}

module.exports = () => {
  const admobIds = loadAdMobAppIds();
  const expo = appJson.expo;
  const profile = process.env.EAS_BUILD_PROFILE ?? '';
  const isRelease = profile === 'production' || profile === 'preview';

  if (!admobIds && isRelease) {
    console.warn(
      '[AdMob] App ID yok — config/admob.ids.json doldurun. Native reklam SDK build’e eklenmedi; admin panelden Unit ID yayınlayınca web dışı reklamlar için yeni build gerekir.',
    );
  }

  return {
    ...expo,
    version: expo.version ?? '1.1.9',
    autolinking: admobIds
      ? expo.autolinking
      : {
          ...(expo.autolinking ?? {}),
          exclude: [
            ...new Set([
              ...(expo.autolinking?.exclude ?? []),
              'react-native-google-mobile-ads',
            ]),
          ],
        },
      android: {
      ...expo.android,
      versionCode: 17,
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
    plugins: admobIds ? patchPlugins(expo.plugins, admobIds) : expo.plugins.filter(
      (entry) => !(Array.isArray(entry) && entry[0] === 'react-native-google-mobile-ads'),
    ),
    extra: {
      ...expo.extra,
      admob: admobIds,
      privacyPolicyUrl: 'https://pazaryeri0.web.app/privacy',
      termsUrl: 'https://pazaryeri0.web.app/terms',
      adsenseClient: 'ca-pub-7876914696425843',
    },
  };
};
