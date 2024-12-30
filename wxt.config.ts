import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  runner: {
    disabled: true,
  },
  manifest: {
    web_accessible_resources: [
      {
        resources: ["main-world.js"],
        matches: ["*://*.chatgpt.com/*"],
      },
    ],
  },
  vite: () => ({
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Array.prototype",
    },
  }),
})
