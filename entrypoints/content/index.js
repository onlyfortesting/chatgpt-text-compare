import "rakit"
import "./style.css"

import { sendMessage } from "webext-bridge/content-script"
import { selectorifyClass, waitFor } from "rakit/utils"

import { HomePrompts } from "./HomePrompts"
import { DiffWithPrevButton } from "./ChatPage"

import axios from "redaxios"
import { compare, createDiffHtml } from "./main"
//----------------------------------------------------------------------------------
// Constants
//----------------------------------------------------------------------------------
const PENDING_DIFF_STORE_PREFIX = "local:pendingdiff_"
//----------------------------------------------------------------------------------
// Global Variables
//----------------------------------------------------------------------------------
let isHomeModified
//----------------------------------------------------------------------------------
// Main Content Script Code
//----------------------------------------------------------------------------------
function loadContentScript(url, ctx) {
  if (url.pathname === "/") {
    // If it's homepage

    if (url.hash || isHomeModified) return

    waitFor(() =>
      $(selectorifyClass("mb-7 hidden text-center @lg/thread:block"))
    ).then((whatCanIHelpWith) => {
      whatCanIHelpWith.after(HomePrompts({}))

      isHomeModified = true
    })
  } else {
    let chats
    waitFor(() => (chats = $$("[data-message-id]")).length).then(() => {
      //----------------------------------------------------------------------------------
      // Helpers
      //----------------------------------------------------------------------------------
      function getChatId(chat) {
        return chat.dataset.messageId
      }

      async function getChatMarkdown(chat) {
        if (chat.matches('[data-message-author-role="assistant"]')) {
          chat._copyButton.click()

          await sleep(50)

          let clipboard = await sendMessage(
            "read-clipboard",
            null,
            "background"
          )
          return clipboard
        } else {
          // role="user"
          console.log($(chat, ".whitespace-pre-wrap"))
          return $(chat, ".whitespace-pre-wrap").textContent
        }
      }

      async function showDiff(chat) {
        const pendingStoreKey = PENDING_DIFF_STORE_PREFIX + getChatId(chat)

        let pending = await storage.getItem(pendingStoreKey)
        let changes =
          (pending?.length && pending) ||
          compare(
            await getChatMarkdown(chats[chats.indexOf(chat) - 1]),
            await getChatMarkdown(chat)
          )

        let comparisonDom = await createDiffHtml(changes, pendingStoreKey)

        let markdownContainer = await waitFor(() => $(chat, ".markdown"))
        markdownContainer.style.whiteSpace = "pre-wrap"
        markdownContainer.textContent = ""
        markdownContainer.append(...comparisonDom)
      }
      //----------------------------------------------------------------------------------
      // Processing Chats
      //----------------------------------------------------------------------------------
      chats.forEach((chat, i) => {
        if (!chat.matches('[data-message-author-role="assistant"]')) return

        let parent = $(chat, "^.group\\/conversation-turn")

        chat._copyButton = $(parent, '[data-testid="copy-turn-action-button"]')

        let buttonGroup = chat._copyButton.parentNode.parentNode

        storage
          .getItem(PENDING_DIFF_STORE_PREFIX + getChatId(chat))
          .then(async (c) => {
            if (!c?.length) return

            showDiff(chat)
          })

        buttonGroup.append(
          h(DiffWithPrevButton, {
            onClick: () => {
              showDiff(chat)
            },
          })
        )
      })
    })
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
