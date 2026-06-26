import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project page is served from https://rupayon123.github.io/sakura/ , so assets
// must be requested under that sub-path in CI builds. Locally we keep base "/".
// (Switch to "/" permanently once a root custom domain is attached.)
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/sakura/" : "/",
});
