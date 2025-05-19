export default defineUnlistedScript(() => {
  let context = window.__reactRouterContext

  document.dispatchEvent(
    new CustomEvent("message-from-main", {
      detail: {
        bearer: null, // context.state.loaderData.root['rq:["session"]'].data.accessToken,
      },
    })
  )
})
