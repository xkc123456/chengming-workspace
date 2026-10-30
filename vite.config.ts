import devServer, { defaultOptions } from "@hono/vite-dev-server";
import path from "path";
import { defineConfig } from "vite";

const __dirname = import.meta.dirname;

export default defineConfig({
  base: "/",
  envDir: __dirname,
  plugins: [
    devServer({
      entry: "api/boot.ts",
      exclude: [/^\/(?!api(?:\/|$)).*/, ...defaultOptions.exclude],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@contracts": path.resolve(__dirname, "contracts"),
      "@db": path.resolve(__dirname, "db"),
    },
  },
  build: { outDir: "dist/public" },
});
