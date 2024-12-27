import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  runner: {
    disabled: true,
  },
  vite: () => ({
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Array.prototype",
    },
  }),
})
