import "rakit"
import "./style.css"

import { sendMessage } from "webext-bridge/content-script"
import { selectorifyClass } from "rakit/utils"

import { HomePrompts } from "./HomePrompts"
import { DiffWithPrevButton } from "./ChatPage"

import axios from "redaxios"
import { compare } from "./main"
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
      () => (chats = $$("[data-message-id]")).length,
      () => {
        // console.log(chats)

        async function getChatMarkdown(chat) {
          if (chat.matches('[data-message-author-role="assistant"]')) {
            chat._copyButton.click()

            let clipboard = await sendMessage(
              "read-clipboard",
              null,
              "background"
            )
            return clipboard
          } else {
            // role="user"
            return $(chat, ".whitespace-pre-wrap").textContent
          }
        }

        chats.forEach((chat, i) => {
          if (!chat.matches('[data-message-author-role="assistant"]')) return

          let parent = $(chat, "^.group\\/conversation-turn")

          chat._copyButton = $(
            parent,
            '[data-testid="copy-turn-action-button"]'
          )

          let buttonGroup = chat._copyButton.parentNode.parentNode

          buttonGroup.append(
            h(DiffWithPrevButton, {
              onClick: async () => {
                let a = await getChatMarkdown(chats[i - 1])
                let b = await getChatMarkdown(chat)

                let comparisonDom = compare(a, b)

                let markdownContainer = $(chat, ".markdown")
                markdownContainer.style.whiteSpace = "pre-wrap"
                markdownContainer.textContent = ""
                markdownContainer.append(...comparisonDom)
              },
            })
          )
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
      // axios
      //   .get(
      //     "https://chatgpt.com/backend-api/conversation/676e73b5-d544-8002-8e84-546840e11174"
      //   )
      //   .then((c) => {
      //     console.log(c.data)
      //   })
    })
    //----------------------------------------------------------------------------------
    // Inject "Main World" Script
    //----------------------------------------------------------------------------------
    await injectScript("/main-world.js", {
      keepInDom: true,
    })
    //----------------------------------------------------------------------------------
    // Load Content Script Based on URL
    //----------------------------------------------------------------------------------
    loadContentScript(window.location, ctx)

    ctx.addEventListener(window, "wxt:locationchange", ({ newUrl }) => {
      if (newUrl.pathname !== "/") isHomeModified = false

      loadContentScript(newUrl, ctx)
    })
  },
})
