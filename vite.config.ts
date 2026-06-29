import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project page is served from https://rupayon123.github.io/sakura/ , so assets
// must be requested under that sub-path in CI builds. Locally we keep base "/".
// (Switch to "/" permanently once a root custom domain is attached.)
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/sakura/" : "/",
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("node_modules/three/")) return "three-core";
          if (id.includes("node_modules/@react-three/fiber")) return "three-fiber";
          if (id.includes("node_modules/@react-three/drei")) return "three-drei";
          if (
            id.includes("node_modules/@react-three/postprocessing") ||
            id.includes("node_modules/postprocessing")
          ) {
            return "three-effects";
          }
          if (
            id.includes("node_modules/three-stdlib") ||
            id.includes("node_modules/@react-spring") ||
            id.includes("node_modules/maath")
          ) {
            return "three-helpers";
          }
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react";
          }
          return "vendor";
        },
      },
    },
  },
});
