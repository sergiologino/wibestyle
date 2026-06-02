const fs = require("node:fs");
const path = require("node:path");

const targets = [
  path.join(__dirname, "..", ".expo"),
  path.join(__dirname, "..", "node_modules", ".cache"),
  path.join(__dirname, "..", "..", "node_modules", ".cache"),
  path.join(__dirname, "..", "..", "node_modules", "metro-file-map", "cache"),
];

for (const target of targets) {
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`Removed ${target}`);
}

console.log("Metro cache cleared. Run: npx expo start -c");
