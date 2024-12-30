export default defineUnlistedScript(() => {
  browser.runtime.onMessage.addListener(handleMessages)

  async function handleMessages(message) {
    if (message.target !== "offscreen-doc") {
      return
    }

    switch (message.type) {
      case "write-clipboard":
        writeClipboard(message.data)
        break
      case "read-clipboard":
        readClipboard()
        break
      default:
        console.warn(`Unexpected message type received: '${message.type}'.`)
    }
  }

  // We use a <textarea> element for two main reasons:
  //  1. preserve the formatting of multiline text,
  //  2. select the node's content using this element's `.select()` method.
  const textEl = document.querySelector("#text")

  async function readClipboard() {
    textEl.select()

    if (document.execCommand("paste")) {
      await browser.runtime.sendMessage({
        type: "got-clipboard",
        target: "background",
        data: textEl.value,
      })
    }

    window.close()
  }

  // Use the offscreen document's `document` interface to write a new value to the
  // system clipboard.
  //
  // At the time this demo was created (Jan 2023) the `navigator.clipboard` API
  // requires that the window is focused, but offscreen documents cannot be
  // focused. As such, we have to fall back to `document.execCommand()`.
  async function writeClipboard(data) {
    try {
      // Error if we received the wrong kind of data.
      if (typeof data !== "string") {
        throw new TypeError(
          `Value provided must be a 'string', got '${typeof data}'.`
        )
      }

      // `document.execCommand('copy')` works against the user's selection in a web
      // page. As such, we must insert the string we want to copy to the web page
      // and to select that content in the page before calling `execCommand()`.
      textEl.value = data
      textEl.select()
      document.execCommand("copy")
    } finally {
      // Job's done! Close the offscreen document.
      window.close()
    }
  }
})
