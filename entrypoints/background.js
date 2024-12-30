import { onMessage } from "webext-bridge/background"

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id })

  function createOffscreenDocument() {
    return browser.offscreen.createDocument({
      url: "offscreen.html",
      reasons: [browser.offscreen.Reason.CLIPBOARD],
      justification: "Read/Write text to the clipboard.",
    })
  }

  onMessage("write-clipboard", async ({ data }) => {
    await createOffscreenDocument()

    browser.runtime.sendMessage({
      type: "write-clipboard",
      target: "offscreen-doc",
      data,
    })
  })

  function withResolver() {
    let resolve
    let prom = new Promise((res) => (resolve = res))
    prom.resolve = resolve
    return prom
  }

  let clipboard = withResolver()
  onMessage("read-clipboard", async ({ data }) => {
    await createOffscreenDocument()

    await browser.runtime.sendMessage({
      type: "read-clipboard",
      target: "offscreen-doc",
      data: "",
    })

    let result = await clipboard

    return result
  })

  browser.runtime.onMessage.addListener(async ({ type, data }) => {
    if (type == "got-clipboard") {
      clipboard.resolve(data)
      clipboard = withResolver()
    }
  })
})
