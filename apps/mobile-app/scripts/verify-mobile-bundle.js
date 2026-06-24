/**
 * Verifies dependencies required by the Android release bundle resolve correctly.
 */
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const projectRoot = path.join(__dirname, "..");
const metroConfig = require(path.join(projectRoot, "metro.config.js"));
const shimEntry = path.join(projectRoot, "shims/webidl-conversions/lib/index.js");

try {
  const babelConfig = require(path.join(projectRoot, "babel.config.js"));
  babelConfig({ cache() {} });
  require("babel-preset-expo");
} catch {
  console.error("babel-preset-expo cannot resolve expo/config.");
  console.error(
    "Run npm install from the repository root and verify the mobile Babel workspace resolution.",
  );
  process.exit(1);
}

try {
  const metroAssetsEntry = require.resolve("metro/src/Assets", {
    paths: [projectRoot],
  });
  createRequire(metroAssetsEntry)("expo-asset/tools/hashAssetFiles");
} catch {
  console.error("Hoisted Metro cannot resolve expo-asset tools.");
  process.exit(1);
}

if (!fs.existsSync(shimEntry)) {
  console.error(`Missing vendored shim: ${shimEntry}`);
  process.exit(1);
}

const shimSource = fs.readFileSync(shimEntry, "utf8");
if (shimSource.includes("SharedArrayBuffer")) {
  console.error("Vendored webidl-conversions must not reference SharedArrayBuffer.");
  process.exit(1);
}

const origin = path.join(
  projectRoot,
  "node_modules/whatwg-url-without-unicode/index.js",
);

const resolved = metroConfig.resolver.resolveRequest(
  {
    originModulePath: origin,
    resolveRequest: require("metro-resolver").resolve,
  },
  "webidl-conversions",
  "android",
);

const aliasOrigin = path.join(projectRoot, "app/(main)/_layout.tsx");
const aliasResolved = metroConfig.resolver.resolveRequest(
  {
    originModulePath: aliasOrigin,
    resolveRequest: (_context, moduleName) => {
      for (const extension of ["", ".ts", ".tsx", ".js", ".jsx"]) {
        const candidate = `${moduleName}${extension}`;
        if (fs.existsSync(candidate)) {
          return { type: "sourceFile", filePath: candidate };
        }
      }
      throw new Error(`Alias target not found: ${moduleName}`);
    },
  },
  "@/theme/tokens",
  "android",
);

const expectedAlias = path.join(projectRoot, "src/theme/tokens.ts").replace(/\\/g, "/");
const actualAlias = aliasResolved?.filePath?.replace(/\\/g, "/");
if (actualAlias !== expectedAlias) {
  console.error("Metro did not resolve the @/* alias correctly:");
  console.error(`  expected: ${expectedAlias}`);
  console.error(`  actual:   ${actualAlias ?? "not resolved"}`);
  process.exit(1);
}

if (!resolved?.filePath) {
  console.error("Metro did not resolve webidl-conversions.");
  process.exit(1);
}

const normalized = resolved.filePath.replace(/\\/g, "/");
const expected = shimEntry.replace(/\\/g, "/");

if (normalized !== expected) {
  console.error("Metro resolved webidl-conversions to the wrong file:");
  console.error(`  expected: ${expected}`);
  console.error(`  actual:   ${normalized}`);
  process.exit(1);
}

console.log("Metro webidl-conversions resolution OK:");
console.log(`  ${normalized}`);
console.log("Babel expo/config resolution OK.");
console.log("Metro expo-asset tools resolution OK.");
console.log("Metro @/* alias resolution OK.");
