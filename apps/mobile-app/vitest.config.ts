import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@react-native-async-storage/async-storage": path.resolve(
        __dirname,
        "src/test/async-storage-mock.ts",
      ),
    },
  },
});
