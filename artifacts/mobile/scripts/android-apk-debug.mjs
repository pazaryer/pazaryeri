#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, '..');
const androidDir = path.join(mobileRoot, 'android');
const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

execSync('node scripts/generate-notification-sounds.mjs', { cwd: mobileRoot, stdio: 'inherit' });

if (!fs.existsSync(path.join(androidDir, 'settings.gradle'))) {
  execSync('npx expo prebuild --platform android --no-install', { cwd: mobileRoot, stdio: 'inherit' });
  execSync('node scripts/patch-android-settings.mjs', { cwd: mobileRoot, stdio: 'inherit' });
} else {
  execSync('node scripts/patch-android-settings.mjs', { cwd: mobileRoot, stdio: 'inherit' });
}

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
execSync(`${gradlew} assembleDebug`, { cwd: androidDir, stdio: 'inherit' });

if (!fs.existsSync(apkPath)) {
  console.error('APK bulunamadı:', apkPath);
  process.exit(1);
}

const outApk = path.join(mobileRoot, 'pazaryeri-debug.apk');
fs.copyFileSync(apkPath, outApk);
console.log('APK hazır:', outApk);
