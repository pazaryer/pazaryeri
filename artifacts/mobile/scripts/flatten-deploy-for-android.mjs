#!/usr/bin/env node
/**
 * pnpm deploy sonrası Windows Gradle için düz node_modules (uzun yol sorunu).
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = process.cwd();
const pkgPath = path.join(root, 'package.json');
let pkgRaw = fs.readFileSync(pkgPath, 'utf8');
const catalog = {
  react: '19.1.0',
  'react-dom': '19.1.0',
  '@tanstack/react-query': '^5.90.21',
  zod: '^3.25.76',
};

for (const [name, ver] of Object.entries(catalog)) {
  pkgRaw = pkgRaw.replaceAll(`"${name}": "catalog:"`, `"${name}": "${ver}"`);
}
pkgRaw = pkgRaw.replaceAll('"workspace:*"', '"file:./vendor/api-client-react"');

const pkg = JSON.parse(pkgRaw);

const vendorDir = path.join(root, 'vendor', 'api-client-react');
const apiClientSrc = path.join(root, 'node_modules', '@workspace', 'api-client-react');

function resolveDeps(section) {
  if (!pkg[section]) return;
  for (const [name, ver] of Object.entries(pkg[section])) {
    if (ver === 'workspace:*') {
      delete pkg[section][name];
    }
  }
}

resolveDeps('dependencies');
resolveDeps('devDependencies');

if (fs.existsSync(apiClientSrc)) {
  fs.rmSync(path.join(root, 'vendor'), { recursive: true, force: true });
  fs.mkdirSync(path.dirname(vendorDir), { recursive: true });
  if (process.platform === 'win32') {
    execSync(`xcopy "${apiClientSrc}" "${vendorDir}" /E /I /H /Y`, { stdio: 'inherit' });
  } else {
    fs.cpSync(apiClientSrc, vendorDir, { recursive: true });
  }
  const vendorPkgPath = path.join(vendorDir, 'package.json');
  let vendorPkgRaw = fs.readFileSync(vendorPkgPath, 'utf8');
  for (const [name, ver] of Object.entries(catalog)) {
    vendorPkgRaw = vendorPkgRaw.replaceAll(`"${name}": "catalog:"`, `"${name}": "${ver}"`);
  }
  fs.writeFileSync(vendorPkgPath, vendorPkgRaw);
  pkg.devDependencies = pkg.devDependencies ?? {};
  pkg.devDependencies['@workspace/api-client-react'] = 'file:./vendor/api-client-react';
}

for (const lock of ['pnpm-lock.yaml', 'package-lock.json']) {
  const p = path.join(root, lock);
  if (fs.existsSync(p)) fs.rmSync(p);
}
if (fs.existsSync(path.join(root, 'node_modules'))) {
  fs.rmSync(path.join(root, 'node_modules'), { recursive: true, force: true });
}

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log('flatten-deploy: npm install (flat node_modules)...');
execSync('npm install --legacy-peer-deps', { cwd: root, stdio: 'inherit' });
console.log('flatten-deploy: OK');
