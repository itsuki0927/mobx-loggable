import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  clean: true,
  // minify: true,
  treeshake: true,
  format: ["esm", "cjs"],
  dts: true,
});
