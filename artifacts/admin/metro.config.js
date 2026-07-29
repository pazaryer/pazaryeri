const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

/** Windows + pnpm monorepo: üst node_modules izlenmesin (ENOENT watcher hatası önlenir). */
const config = getDefaultConfig(projectRoot);
config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(projectRoot, '..', '..', 'node_modules'),
];

module.exports = config;
