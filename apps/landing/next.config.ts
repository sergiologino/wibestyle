import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@wibestyle/ui"],
  images: {
    unoptimized: true,
  },
  // Parent folder also has package-lock.json; without this Turbopack watches
  // the whole Look/ tree, mis-resolves assets/CSS, and spikes CPU in dev.
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
