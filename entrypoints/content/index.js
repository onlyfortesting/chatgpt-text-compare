import "rakit"
import "./style.css"

import { sendMessage } from "webext-bridge/content-script"
import { selectorifyClass, waitFor } from "rakit/utils"

import { HomePrompts } from "./HomePrompts"
import { DiffWithPrevButton, Tooltip } from "./ChatPage"

import axios from "redaxios"
import { compare, createDiffHtml } from "./main"

import { createUndoer } from "rakit/utils"
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
        //----------------------------------------------------------------------------------
        // Replace markdown with diff
        //----------------------------------------------------------------------------------
        let markdownContainer = await waitFor(() => $(chat, ".markdown"))
        markdownContainer.style.whiteSpace = "pre-wrap"
        markdownContainer.textContent = ""
        markdownContainer.append(...comparisonDom)
        //----------------------------------------------------------------------------------
        // Click listener for diff items
        //----------------------------------------------------------------------------------
        // Remove unused field to save storage space
        changes.forEach((c) => delete c.count)

        let addremove = changes.filter((c) => c.value)

        const undoer = createUndoer({
          onUpdate() {
            chat._undoer(this)
          },
        })

        $(chat)
          .off("pointerdown", chat._diffclick)
          .on(
            "pointerdown",
            (chat._diffclick = (e) => {
              if (e.buttons !== 1) return

              let closest = e.target.closest(".added,.removed")
              if (!closest) return

              e.preventDefault()
              e.stopPropagation()

              let nearby = [closest.nextSibling, closest.previousSibling].find(
                (c) => c?._data?.added || c?._data?.removed
              )

              const batch = undoer.batcher()
              const closestEmptier = document.createTextNode("")
              const closestReplacer = document.createTextNode(
                closest._data.value
              )
              if (nearby) {
                const nearbyEmptier = document.createTextNode("")

                batch.push(() => {
                  nearby.replaceWith(nearbyEmptier)
                  closest.replaceWith(closestReplacer)

                  const addremoveClone = addremove.slice()
                  addremove.splice(addremove.indexOf(nearby._data), 1)
                  addremove.splice(addremove.indexOf(closest._data), 1, {
                    value: closest._data.value,
                  })

                  return () => {
                    nearbyEmptier.replaceWith(nearby)
                    closestReplacer.replaceWith(closest)

                    addremove.length = 0
                    addremove.push(...addremoveClone)
                  }
                })
              } else {
                if (closest._data.added) {
                  batch.push(() => {
                    closest.replaceWith(closestReplacer)

                    const addremoveClone = addremove.slice()
                    addremove.splice(addremove.indexOf(closest._data), 1, {
                      value: closest._data.value,
                    })

                    return () => {
                      closestReplacer.replaceWith(closest)

                      addremove.length = 0
                      addremove.push(...addremoveClone)
                    }
                  })
                }
                if (closest._data.removed) {
                  batch.push(() => {
                    closest.replaceWith(closestEmptier)

                    const addremoveClone = addremove.slice()
                    addremove.splice(addremove.indexOf(closest._data), 1)

                    return () => {
                      closestEmptier.replaceWith(closest)

                      addremove.length = 0
                      addremove.push(...addremoveClone)
                    }
                  })
                }
              }

              const save = () => {
                const isResolved = !addremove.some((c) => c.added || c.removed)
                if (isResolved) storage.removeItem(pendingStoreKey)
                else storage.setItem(pendingStoreKey, addremove.slice())
              }

              batch.push(() => {
                save()
                return () => save()
              })

              batch.done()
            })
          )
      }
      //----------------------------------------------------------------------------------
      // Processing Chats
      //----------------------------------------------------------------------------------
      chats.forEach((chat, i) => {
        if (!chat.matches('[data-message-author-role="assistant"]')) return

        let parent = $(chat, "^.group\\/conversation-turn")

        chat._copyButton = $(parent, '[data-testid="copy-turn-action-button"]')

        let buttonGroup = chat._copyButton.parentNode.parentNode

        buttonGroup.append(
          h(DiffWithPrevButton, {
            chat,
            onClick: () => {
              showDiff(chat)
            },
          })
        )

        storage
          .getItem(PENDING_DIFF_STORE_PREFIX + getChatId(chat))
          .then(async (c) => {
            if (!c?.length) return

            showDiff(chat)
          })
      })
    })
    //----------------------------------------------------------------------------------
    // Tooltip Handling
    //----------------------------------------------------------------------------------
    let showTooltip = $state(false)
    let text = $state("ehehe")
    let tooltip = Tooltip({ content: text })
    let timeId
    $(document)
      .off("pointerover", document._onOver)
      .on(
        "pointerover",
        (document._onOver = (e) => {
          const target = e.target.closest(".added,.removed")
          if (!target) {
            clearTimeout(timeId)
            showTooltip(false)
            return
          }

          timeId = setTimeout(() => {
            showTooltip(true)
          }, 500)
        })
      )

    $(document)
      .off("mousemove", document._onMove)
      .on(
        "mousemove",
        (document._onMove = (e) => {
          tooltip.style.setProperty("--mouse-x", e.clientX + "px")
          tooltip.style.setProperty("--mouse-y", e.clientY + "px")
        })
      )

    $effect(() => {
      if (showTooltip()) {
        if (!tooltip.parentNode) document.body.append(tooltip)
      } else {
        if (tooltip.parentNode) tooltip.remove()
      }
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
