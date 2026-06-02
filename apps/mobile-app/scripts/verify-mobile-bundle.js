/**
 * Verifies Metro resolves webidl-conversions to the Hermes-safe vendored copy.
 */
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const metroConfig = require(path.join(projectRoot, "metro.config.js"));
const shimEntry = path.join(projectRoot, "shims/webidl-conversions/lib/index.js");

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
