import "rakit"
import "./style.css"
import { selectorifyClass } from "rakit/utils"

import { HomePrompts } from "./HomePrompts"
import { DiffWithPrevButton } from "./ChatPage"

import axios from "redaxios"

//----------------------------------------------------------------------------------
// Global Variables
//----------------------------------------------------------------------------------
let isHomeModified
//----------------------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------------------
function waitUntil(condFn, fn, duration = 250) {
  if (condFn()) {
    fn()
    return
  }

  setTimeout(() => {
    waitUntil(condFn, fn, duration)
  }, duration)
}
//----------------------------------------------------------------------------------
// Main Content Script Code
//----------------------------------------------------------------------------------
function loadContentScript(url, ctx) {
  if (url.pathname === "/") {
    // If it's homepage

    if (url.hash || isHomeModified) return

    let whatCanIHelpWith

    waitUntil(
      () =>
        (whatCanIHelpWith = $(
          selectorifyClass("mb-7 hidden text-center @lg/thread:block")
        )),
      async () => {
        // console.log(whatCanIHelpWith)
        whatCanIHelpWith.after(HomePrompts({}))

        isHomeModified = true
      }
    )
  } else {
    let chats
    waitUntil(
      // () => (chats = $$('[data-message-author-role="user"]')).length,
      () => (chats = $$('[data-message-author-role="assistant"]')).length,
      // () => (chats = $("[data-message-id]")).length,
      () => {
        // console.log(chats)

        chats.forEach((chat) => {
          let parent = $(chat, "^.group\\/conversation-turn")

          let copyBtn = $(parent, '[data-testid="copy-turn-action-button"]')
          let buttonGroup = copyBtn.parentNode.parentNode

          buttonGroup.append(
            h(DiffWithPrevButton, {
              onClick: async () => {
                // axios
                //   .get(
                //     "https://chatgpt.com/backend-api/conversation/676e73b5-d544-8002-8e84-546840e11174"
                //   )
                //   .then((c) => {
                //     console.log(c.data)
                //   })

                copyBtn.click()
                console.log()
                // console.log($(parent, ".markdown").textContent)
              },
            })
          )

          console.log(buttonGroup)
        })
      }
    )
  }
}
//----------------------------------------------------------------------------------
// WXT Content Script Initializer
//----------------------------------------------------------------------------------
export default defineContentScript({
  matches: ["*://*.chatgpt.com/*"],

  async main(ctx) {
    //----------------------------------------------------------------------------------
    // Message Listener
    //----------------------------------------------------------------------------------
    $(document).on("message-from-main", (e) => {
      const { bearer } = e.detail

      axios.defaults.headers = {
        Authorization: "Bearer " + bearer,
      }
    })
    //----------------------------------------------------------------------------------
    // Inject "Main World" Script
    //----------------------------------------------------------------------------------
    await injectScript("/main-world.js", {
      keepInDom: true,
    })
    //----------------------------------------------------------------------------------
    // Load Content Script Based on URL
    //----------------------------------------------------------------------------------pas
    loadContentScript(window.location, ctx)

    ctx.addEventListener(window, "wxt:locationchange", ({ newUrl }) => {
      if (newUrl.pathname !== "/") isHomeModified = false

      loadContentScript(newUrl, ctx)
    })
  },
})
