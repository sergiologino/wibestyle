import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.resolve(__dirname, "../..");

/**
 * Parent `Look/` has a stray package-lock.json — without an explicit turbopack root
 * Next.js watches the whole Look/ tree, fails to resolve tailwindcss, and spins CPU/RAM
 * until the dev process OOMs (see dev-server-3001.err.log).
 *
 * When API/Gradle runs in parallel, also ignore backend build + local storage writes.
 */
const devWatchIgnored = [
  "**/node_modules/**",
  "**/services/api/**",
  "**/data/storage/**",
  "**/.gradle/**",
];

const nextConfig: NextConfig = {
  transpilePackages: ["@wibestyle/ui", "@wibestyle/shared-types", "@wibestyle/api-client"],
  turbopack: {
    root: monorepoRoot,
  },
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: devWatchIgnored,
      };
    }
    return config;
  },
};

export default nextConfig;
