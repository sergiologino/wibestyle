import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

if (manifest.name !== "wibestyle-monorepo") {
  throw new Error(`Unexpected workspace root: ${root}`);
}

const targets = [join(root, "node_modules")];
for (const group of ["apps", "packages"]) {
  const groupPath = join(root, group);
  if (!existsSync(groupPath)) continue;
  for (const entry of readdirSync(groupPath, { withFileTypes: true })) {
    if (entry.isDirectory()) targets.push(join(groupPath, entry.name, "node_modules"));
  }
}

for (const target of targets) {
  const resolved = resolve(target);
  const pathFromRoot = relative(root, resolved);
  const isInsideWorkspace = pathFromRoot && !pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== "..";
  if (!isInsideWorkspace || basename(resolved) !== "node_modules") {
    throw new Error(`Refusing to remove unsafe path: ${resolved}`);
  }
  if (existsSync(resolved)) {
    console.log(`Removing ${pathFromRoot}...`);
    rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 });
  }
}

console.log("Installing exact package-lock dependencies...");
const npmCli = process.env.npm_execpath;
if (!npmCli || !existsSync(npmCli)) {
  throw new Error("npm CLI path is unavailable. Run this repair through `npm run deps:repair`.");
}

const result = spawnSync(process.execPath, [npmCli, "ci", "--include=optional"], {
  cwd: root,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
