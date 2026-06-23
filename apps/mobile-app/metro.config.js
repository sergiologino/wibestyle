const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

/** Hermes-safe webidl-conversions@5, vendored for monorepo (root hoists v8). */
const safeWebidlConversionsEntry = path.resolve(
  projectRoot,
  "shims/webidl-conversions/lib/index.js",
);

const config = getDefaultConfig(projectRoot);

// React Native Gradle passes the entry file relative to the app root on Windows.
// Keep Metro's server root there as well; workspace packages remain available below.
config.server.unstable_serverRoot = projectRoot;
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "webidl-conversions" ||
    moduleName.startsWith("webidl-conversions/")
  ) {
    return { type: "sourceFile", filePath: safeWebidlConversionsEntry };
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  /[/\\]apps[/\\](web-app|landing|admin)[/\\]/,
  /[/\\]node_modules[/\\]next[/\\]/,
];

module.exports = config;
