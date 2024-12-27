import "rakit"
import "./style.css"
import { selectorifyClass } from "rakit/utils"

import { HomePrompts } from "./HomePrompts"

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
      () => (chats = $$('[data-message-author-role="user"]')).length,
      () => {
        console.log(chats)

        chats.forEach((chat) => {
          // let button = $("span[data-state]", chat)
          // button.parentNode.style.display = "flex"
          // let myBtn = button.cloneNode(true)
          // button.after(myBtn)
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
  // cssInjectionMode: "ui",

  main(ctx) {
    loadContentScript(window.location, ctx)

    ctx.addEventListener(window, "wxt:locationchange", ({ newUrl }) => {
      if (newUrl.pathname !== "/") isHomeModified = false

      loadContentScript(newUrl, ctx)
    })
  },
})

// const ui = await createShadowRootUi(ctx, {
//   name: "example-ui",
//   position: "after",
//   anchor: premadePromptContainer,
//   onMount(container) {
//     // Define how your UI will be mounted inside the container
//     const app = document.createElement("p")
//     $(app).addClass("bg-[#BADA55]")
//     app.textContent = "Hello world!"
//     container.append(app)
//   },
// })
//
// ui.mount()
