const { expoRouterBabelPlugin } = require("babel-preset-expo/build/expo-router-plugin");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Monorepo: babel-preset-expo skips expo-router when it is not hoisted to the repo root.
    plugins: [expoRouterBabelPlugin],
  };
};
