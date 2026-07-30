/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
});
