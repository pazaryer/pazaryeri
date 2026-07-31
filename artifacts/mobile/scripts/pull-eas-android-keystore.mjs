#!/usr/bin/env node
/**
 * EAS'tan release keystore indirir (yerel AAB derlemesi icin).
 * EXPO_TOKEN ortam degiskeni gerekir. Parolalar konsola yazilmaz.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, '..');
const token = process.env.EXPO_TOKEN?.trim();
if (!token) {
  console.error('EXPO_TOKEN eksik');
  process.exit(1);
}

const query = `
  query PullAndroidKeystore($projectFullName: String!, $applicationIdentifier: String) {
    app {
      byFullName(fullName: $projectFullName) {
        androidAppCredentials(
          filter: { applicationIdentifier: $applicationIdentifier, legacyOnly: false }
        ) {
          androidAppBuildCredentialsList {
            isDefault
            name
            androidKeystore {
              keystore
              keystorePassword
              keyAlias
              keyPassword
            }
          }
        }
      }
    }
  }
`;

const res = await fetch('https://api.expo.dev/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    query,
    variables: {
      projectFullName: '@pazaryeri/pazaryeri',
      applicationIdentifier: 'com.pazaryerim',
    },
  }),
});

if (!res.ok) {
  console.error('GraphQL HTTP', res.status);
  process.exit(1);
}

const json = await res.json();
if (json.errors?.length) {
  console.error('GraphQL errors:', json.errors.map((e) => e.message).join('; '));
  process.exit(1);
}

const list =
  json.data?.app?.byFullName?.androidAppCredentials?.[0]?.androidAppBuildCredentialsList ?? [];
const creds = list.find((c) => c.isDefault) ?? list[0];
const ks = creds?.androidKeystore;
if (!ks?.keystore) {
  console.error('EAS uzerinde keystore bulunamadi');
  process.exit(1);
}

const keystorePath = path.join(mobileRoot, 'android-release.keystore');
const propsPath = path.join(mobileRoot, 'android-release.properties');
fs.writeFileSync(keystorePath, Buffer.from(ks.keystore, 'base64'));
fs.writeFileSync(
  propsPath,
  `storePassword=${ks.keystorePassword}\nkeyPassword=${ks.keyPassword ?? ks.keystorePassword}\nkeyAlias=${ks.keyAlias}\n`,
  'utf8',
);
console.log(`Keystore: ${keystorePath}`);
console.log(`Props: ${propsPath}`);
console.log(`Alias: ${ks.keyAlias}`);
