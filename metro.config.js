const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('tflite');

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
});
