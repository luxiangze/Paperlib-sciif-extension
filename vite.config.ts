import commonjs from "@rollup/plugin-commonjs";
import { rmSync } from "node:fs";
import path from "node:path";
import modify from "rollup-plugin-modify";
import { defineConfig } from "vite";
import { builtinModules } from 'module';

import pkg from "./package.json";

rmSync("dist", { recursive: true, force: true });
rmSync("release", { recursive: true, force: true });

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    manifest: false,
    minify: false,
    reportCompressedSize: true,
    lib: {
      entry: path.resolve(__dirname, "src/main.ts"),
      fileName: "main",
      name: "PaperlibEntryScrapeExtension",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: [...builtinModules, "paperlib"],
      output: {
        format: "cjs",
      },
    },
    outDir: "dist",
  },

  esbuild: {
    keepNames: true,
  },

  resolve: {
    alias: {
      "@": path.join(__dirname, "src") + "/",
    },
  },

  server: process.env.NODE_ENV
    ? {
        host: pkg.debug.env.VITE_DEV_SERVER_HOSTNAME,
        port: pkg.debug.env.VITE_DEV_SERVER_PORT,
      }
    : undefined,

  plugins: [
    commonjs(),
    modify({
      find: /import.*from "paperlib";?/,
      // find: /import { PLAPI } from "paperlib";/,
      replace: (match, path) => "",
    }),
  ],
});
