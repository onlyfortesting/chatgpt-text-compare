import { defineConfig } from "wxt"
import tailwindcss from "@tailwindcss/vite"

// See https://wxt.dev/api/config.html
export default defineConfig({
  webExt: {
    disabled: true,
  },
  manifest: {
    permissions: ["storage", "clipboardRead", "clipboardWrite", "offscreen"],
    web_accessible_resources: [
      {
        resources: ["main-world.js"],
        matches: ["*://*.chatgpt.com/*"],
      },
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Array.prototype",
    },
  }),
})
