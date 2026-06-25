const path = require("node:path");
const Module = require("node:module");

/**
 * npm 11 may hoist Expo build tools to the monorepo root while keeping their
 * Expo peer dependencies in the mobile workspace. Make that workspace visible
 * to Node's own CJS resolver before Babel or Metro loads the hoisted tools.
 */
module.exports = function registerWorkspaceModules() {
  const mobileNodeModules = path.join(__dirname, "..", "node_modules");
  const nodePathEntries = (process.env.NODE_PATH || "")
    .split(path.delimiter)
    .filter(Boolean);

  if (nodePathEntries.includes(mobileNodeModules)) {
    return;
  }

  process.env.NODE_PATH = [mobileNodeModules, ...nodePathEntries].join(
    path.delimiter,
  );
  Module._initPaths();
};
