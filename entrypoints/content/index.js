import "rakit"
import "./style.css"

import { sendMessage } from "webext-bridge/content-script"
import { selectorifyClass, waitFor } from "rakit/utils"

import { HomePrompts } from "./HomePrompts"
import { DiffWithPrevButton } from "./ChatPage"
import { Tooltip, TooltipDiffSingle } from "./Tooltip"

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
      // Chat: Helpers
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
        //----------------------------------------------------------------------------------
        // # Load pending diff, if it doesn't exist then create a new diff
        //----------------------------------------------------------------------------------
        let pending = await storage.getItem(pendingStoreKey)
        let changes =
          (pending?.length && pending) ||
          compare(
            await getChatMarkdown(chats[chats.indexOf(chat) - 1]),
            await getChatMarkdown(chat)
          )

        let comparisonDom = await createDiffHtml(changes, pendingStoreKey)
        //----------------------------------------------------------------------------------
        // # Replace chat text with diff
        //----------------------------------------------------------------------------------
        let markdownContainer = await waitFor(() => $(chat, ".markdown"))
        markdownContainer.style.whiteSpace = "pre-wrap"
        markdownContainer.textContent = ""
        markdownContainer.append(...comparisonDom)
        //----------------------------------------------------------------------------------
        // # Click listener for diff items
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
              let closest = e.target.closest(".added,.removed")
              if (!closest) return

              e.preventDefault()
              e.stopPropagation()

              let reject
              if (e.buttons === 2) {
                reject = true

                // Disable context menu when right clicking (one-time)
                $(e.currentTarget).on(
                  "contextmenu",
                  (x) => x.preventDefault(),
                  {
                    once: true,
                  }
                )
              }

              let nearby = [closest.nextSibling, closest.previousSibling].find(
                (c) => c?._data?.added || c?._data?.removed
              )

              const batch = undoer.batcher()
              const closestEmptier = document.createTextNode("")
              const closestReplacer = document.createTextNode(
                closest._data.value
              )
              if (nearby) {
                if (reject) return

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
                if (
                  (closest._data.added && !reject) ||
                  (closest._data.removed && reject)
                ) {
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
                } else {
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
      // Chat: Augmenting Chats
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
    // Tooltip: Helpers
    //----------------------------------------------------------------------------------
    function createTooltip(initFn, timeout = 500) {
      let ctx = {}
      let tooltip = initFn.call(ctx)
      let timeId
      let lastTarget

      return {
        update({ target, onShow, onRemove }) {
          clearTimeout(timeId)

          tooltip._onRemove = () => {
            onRemove.call(ctx, { target, tooltip })
            tooltip.remove()
          }

          if (!target) {
            tooltip._onRemove()
            return
          }

          timeId = setTimeout(
            () => {
              onShow.call(ctx, { target, tooltip })

              if (!tooltip.parentNode) document.body.append(tooltip)

              if (lastTarget)
                $(lastTarget).off("pointerdown", lastTarget._onTooltipDown)

              lastTarget = target

              // Remove tooltip on click
              $(target).on(
                "pointerdown",
                (target._onTooltipDown = () => {
                  tooltip._onRemove()
                })
              )
            },
            tooltip.parentNode ? 0 : timeout
          )
        },
      }
    }
    //----------------------------------------------------------------------------------
    // Tooltip: Mouse position for tooltip diff item positioning
    //----------------------------------------------------------------------------------
    const mouseX = $state(0)
    const mouseY = $state(0)
    $(document)
      .off("mousemove", document._onMove)
      .on(
        "mousemove",
        (document._onMove = (e) => {
          mouseX(e.clientX)
          mouseY(e.clientY)
        })
      )
    //----------------------------------------------------------------------------------
    // Tooltip: Init
    //----------------------------------------------------------------------------------
    const tooltip = createTooltip(function () {
      this.tooltipContent = $state("")
      return Tooltip({ children: this.tooltipContent })
    })

    const tooltipDiff = createTooltip(() =>
      Tooltip({
        style: () => `left:${mouseX()}px; top:${mouseY() + 24}px`,
        children: TooltipDiffSingle,
      })
    )
    //----------------------------------------------------------------------------------
    // Tooltip: Logic
    //----------------------------------------------------------------------------------
    $(document)
      .off("pointerover", document._onOver)
      .on(
        "pointerover",
        (document._onOver = (e) => {
          tooltip.update({
            target: e.target.closest(`[data-my-tooltip]`),
            onShow({ target, tooltip }) {
              this.tooltipContent(target.dataset.myTooltip)

              // Positioning
              let { left, bottom, width } = target.getBoundingClientRect()
              tooltip.style.left = left + width / 2 + "px"
              tooltip.style.top = bottom + 6 + "px"
            },
            onRemove() {},
          })

          tooltipDiff.update({
            target: e.target.closest(`[data-single="true"]`),
            onShow() {},
            onRemove() {},
          })
        })
      )
  }
}
//----------------------------------------------------------------------------------
// WXT: WXT Content Script Initializer
//----------------------------------------------------------------------------------
export default defineContentScript({
  matches: ["*://*.chatgpt.com/*"],

  async main(ctx) {
    //----------------------------------------------------------------------------------
    // # Message Listener
    //----------------------------------------------------------------------------------
    $(document).on("message-from-main", (e) => {
      const { bearer } = e.detail

      axios.defaults.headers = {
        Authorization: "Bearer " + bearer,
      }
      // let res = await axios.get("https://chatgpt.com/backend-api/conversation/676e73b5-d544-8002-8e84-546840e11174")
      // console.log(res.data)
    })
    //----------------------------------------------------------------------------------
    // # Inject "Main World" Script
    //----------------------------------------------------------------------------------
    await injectScript("/main-world.js", {
      keepInDom: true,
    })
    //----------------------------------------------------------------------------------
    // # Load Content Script Based on URL
    //----------------------------------------------------------------------------------
    loadContentScript(window.location, ctx)

    // Handle SPA navigation
    ctx.addEventListener(window, "wxt:locationchange", ({ newUrl }) => {
      if (newUrl.pathname !== "/") isHomeModified = false

      loadContentScript(newUrl, ctx)
    })
  },
})
