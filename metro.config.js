const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'onnx' to the list of assets to be resolved
config.resolver.assetExts.push('onnx');

module.exports = config;
