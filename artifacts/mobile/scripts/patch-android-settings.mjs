#!/usr/bin/env node
/**
 * Gradle, Windows'ta Unicode yol (Masaüstü vb.) ile includeBuild'te hata veriyor.
 * settings.gradle içinde göreli yollar kullanır.
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, '..');
const androidDir = path.join(mobileRoot, 'android');
const settingsPath = path.join(androidDir, 'settings.gradle');

if (!fs.existsSync(settingsPath)) {
  console.warn('patch-android-settings: android/settings.gradle yok, atlanıyor.');
  process.exit(0);
}

const rnPkg = require.resolve('@react-native/gradle-plugin/package.json', {
  paths: [require.resolve('react-native/package.json')],
});
const expoAutoPkg = require.resolve('expo-modules-autolinking/package.json', {
  paths: [require.resolve('expo/package.json')],
});

const rnRel = path.relative(androidDir, path.dirname(rnPkg)).replace(/\\/g, '/');
const expoRel = path
  .relative(androidDir, path.join(path.dirname(expoAutoPkg), 'android', 'expo-gradle-plugin'))
  .replace(/\\/g, '/');

const content = `pluginManagement {
  includeBuild("${rnRel}")
  includeBuild("${expoRel}")
}

plugins {
  id("com.facebook.react.settings")
  id("expo-autolinking-settings")
}

extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->
  if (System.getenv('EXPO_USE_COMMUNITY_AUTOLINKING') == '1') {
    ex.autolinkLibrariesFromCommand()
  } else {
    ex.autolinkLibrariesFromCommand(expoAutolinking.rnConfigCommand)
  }
}
expoAutolinking.useExpoModules()

rootProject.name = 'Pazaryeri'

expoAutolinking.useExpoVersionCatalog()

include ':app'
includeBuild(expoAutolinking.reactNativeGradlePlugin)
`;

fs.writeFileSync(settingsPath, content);
console.log('patch-android-settings: settings.gradle güncellendi (göreli yollar).');

const appBuildGradlePath = path.join(androidDir, 'app', 'build.gradle');
if (fs.existsSync(appBuildGradlePath)) {
  let appGradle = fs.readFileSync(appBuildGradlePath, 'utf8');
  const cmakeArg = 'arguments "-DCMAKE_OBJECT_PATH_MAX=128"';
  if (!appGradle.includes('CMAKE_OBJECT_PATH_MAX')) {
    if (appGradle.includes('externalNativeBuild {')) {
      appGradle = appGradle.replace(
        /externalNativeBuild\s*\{\s*\n\s*cmake\s*\{/,
        `externalNativeBuild {\n        cmake {\n            ${cmakeArg}`,
      );
    } else if (appGradle.includes('defaultConfig {')) {
      appGradle = appGradle.replace(
        /defaultConfig\s*\{/,
        `defaultConfig {\n        externalNativeBuild {\n            cmake {\n                ${cmakeArg}\n            }\n        }`,
      );
    }
    fs.writeFileSync(appBuildGradlePath, appGradle);
    console.log('patch-android-settings: app/build.gradle CMAKE_OBJECT_PATH_MAX eklendi.');
  }
}

const gradlePropsPath = path.join(androidDir, 'gradle.properties');
if (fs.existsSync(gradlePropsPath)) {
  let props = fs.readFileSync(gradlePropsPath, 'utf8');
  if (!props.includes('android.overridePathCheck=true')) {
    props += '\nandroid.overridePathCheck=true\n';
    fs.writeFileSync(gradlePropsPath, props);
    console.log('patch-android-settings: gradle.properties overridePathCheck eklendi.');
  }
  if (!props.includes('android.enableLongPaths=true')) {
    props += 'android.enableLongPaths=true\n';
    fs.writeFileSync(gradlePropsPath, props);
    console.log('patch-android-settings: gradle.properties enableLongPaths eklendi.');
  }
}
