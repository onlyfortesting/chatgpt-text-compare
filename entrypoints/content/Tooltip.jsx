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
// Tooltip: Setup
//----------------------------------------------------------------------------------
export function setupTooltip() {
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

export function XTooltip({ children, ...rest }) {
  return (
    <div
      data-radix-popper-content-wrapper=""
      style="position: fixed; min-width: max-content; --radix-popper-transform-origin: 50% 0px; z-index: 50; --radix-popper-available-width: 1004.7999877929688px; --radix-popper-available-height: 185.41248703002935px; --radix-popper-anchor-width: 65.45000457763672px; --radix-popper-anchor-height: 30.387500762939453px;"
      {...rest}
    >
      <div
        data-side="bottom"
        data-align="center"
        data-state="delayed-open"
        class="relative z-50 transition-opacity select-none px-2 py-1 rounded-lg overflow-hidden bg-black max-w-xs"
        style="--radix-tooltip-content-transform-origin: var(--radix-popper-transform-origin); --radix-tooltip-content-available-width: var(--radix-popper-available-width); --radix-tooltip-content-available-height: var(--radix-popper-available-height); --radix-tooltip-trigger-width: var(--radix-popper-anchor-width); --radix-tooltip-trigger-height: var(--radix-popper-anchor-height);"
      >
        <div class="flex gap-1">
          <div>
            <div class="text-xs font-semibold whitespace-pre-wrap normal-case text-center text-white">
              {children}
            </div>
          </div>
        </div>
        <span
          id="radix-«r2g»"
          role="tooltip"
          style="position: absolute; border: 0px; width: 1px; height: 1px; padding: 0px; margin: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; overflow-wrap: normal;"
        >
          <div class="flex gap-1">
            <div>
              <div class="text-xs font-semibold whitespace-pre-wrap normal-case text-center text-white">
                {children}
              </div>
            </div>
          </div>
        </span>
      </div>
    </div>
  )
}

export function Tooltip({ children, ...rest }) {
  return (
    <div class="fixed pointer-events-none z-50 select-none" {...rest}>
      <div class="relative -left-1/2 shadow-xs transition-opacity px-3 py-2 rounded-lg border-white/10 dark:border bg-gray-950 max-w-xs">
        <span class="flex items-center whitespace-pre-wrap font-semibold normal-case text-center text-gray-100 text-sm">
          {children}
        </span>
        <span
          class="absolute top-0 left-1/2 -translate-x-1/2 rotate-180"
          style="transform-origin: center 0px"
        >
          <div
            class="relative top-[-4px] h-2 w-2 rotate-45 transform shadow-xs dark:border-r dark:border-b border-white/10 bg-gray-950"
            width="10"
            height="5"
            viewbox="0 0 30 10"
            preserveaspectratio="none"
            style="display: block;"
          ></div>
        </span>
      </div>
    </div>
  )
}

export function TooltipDiffSingle() {
  return (
    <>
      <div class="flex gap-6">
        <div class="flex gap-2">
          {svg(() => (
            <svg
              class="icon-md-heavy"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                color="currentColor"
              >
                <path d="M13.5 5.5V2m0 10V9m0 13c6 0 7.5-4.51 7.5-10S19.5 2 13.5 2S6 6.51 6 12s1.5 10 7.5 10" />
                <path d="M15 7c0-.466 0-.699-.076-.883a1 1 0 0 0-.541-.54c-.184-.077-.417-.077-.883-.077s-.699 0-.883.076a1 1 0 0 0-.54.541C12 6.301 12 6.534 12 7v.5c0 .466 0 .699.076.883a1 1 0 0 0 .541.54c.184.077.417.077.883.077s.699 0 .883-.076a1 1 0 0 0 .54-.541C15 8.199 15 7.966 15 7.5zm-9 5h15M5 3.167L4.619 2m-.59 3.567L3 6" />
              </g>
            </svg>
          ))}
          Accept
        </div>
        <div class="flex gap-2">
          {svg(() => (
            <svg
              class="icon-md-heavy"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                color="currentColor"
              >
                <path d="M10.5 5.5V2m0 10V9m0 13c6 0 7.5-4.51 7.5-10S16.5 2 10.5 2S3 6.51 3 12s1.5 10 7.5 10M18 12H3m16-8.833L19.381 2m.59 3.567L21 6" />
                <path d="M9 7c0-.466 0-.699.076-.883a1 1 0 0 1 .541-.54c.184-.077.417-.077.883-.077s.699 0 .883.076a1 1 0 0 1 .54.541C12 6.301 12 6.534 12 7v.5c0 .466 0 .699-.076.883a1 1 0 0 1-.541.54C11.199 9 10.966 9 10.5 9s-.699 0-.883-.076a1 1 0 0 1-.54-.541C9 8.199 9 7.966 9 7.5z" />
              </g>
            </svg>
          ))}
          Reject
        </div>
      </div>
    </>
  )
}
