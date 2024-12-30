export default defineUnlistedScript(() => {
  let context = window.__remixContext
  // console.log(context)

  document.dispatchEvent(
    new CustomEvent("message-from-main", {
      detail: {
        bearer:
          context.state.loaderData.root['rq:["session"]'].data.accessToken,
        // state: JSON.parse(JSON.stringify(window.__remixContext))
      },
    })
  )
})
