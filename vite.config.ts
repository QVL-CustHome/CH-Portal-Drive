/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT ?? 3202),
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.GATEWAY_URL ?? "http://localhost:8180",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "app.js"],
      exclude: ["src/main.tsx", "src/test/**", "src/lib/navigation.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80,
      },
    },
  },
});
