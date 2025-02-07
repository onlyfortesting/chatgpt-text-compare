export function DiffWithPrevButton({ chat, onClick }) {
  const diffing = $state(false)
  const undoer = $state()

  chat._undoer = undoer

  return (
    <span>
      <button
        class="rounded-lg text-token-text-secondary hover:bg-token-main-surface-secondary"
        onclick={(e) => {
          diffing(true)
          onClick(e)
        }}
      >
        <span class="flex h-[32px] w-[32px] items-center justify-center">
          {svg(() => (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon-md-heavy text-green-500"
              viewBox="0 0 24 24"
            >
              <g
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              >
                <path d="M4 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0m12 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
                <path d="M11 6h5a2 2 0 0 1 2 2v8" />
                <path d="m14 9l-3-3l3-3m-1 15H8a2 2 0 0 1-2-2V8" />
                <path d="m10 15l3 3l-3 3" />
              </g>
            </svg>
          ))}
        </span>
      </button>
      {() =>
        undoer() && (
          <>
            <button
              class="rounded-lg text-token-text-secondary hover:bg-token-main-surface-secondary disabled:opacity-60"
              disabled={() => !undoer().canUndo()}
              onclick={() => undoer().undo()}
            >
              <span class="flex h-[32px] w-[32px] items-center justify-center">
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
                      stroke-width="2"
                    >
                      <path d="m9 14l-4-4l4-4" />
                      <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
                    </g>
                  </svg>
                ))}
              </span>
            </button>
            <button
              class="rounded-lg text-token-text-secondary hover:bg-token-main-surface-secondary disabled:opacity-60"
              disabled={() => !undoer().canRedo()}
              onclick={() => undoer().redo()}
            >
              <span class="flex h-[32px] w-[32px] items-center justify-center">
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
                      stroke-width="2"
                    >
                      <path d="m15 14l4-4l-4-4" />
                      <path d="M19 10H8a4 4 0 1 0 0 8h1" />
                    </g>
                  </svg>
                ))}
              </span>
            </button>
          </>
        )
      }
    </span>
  )
}

export function Tooltip({ content }) {
  return (
    <div
      data-side="bottom"
      data-align="center"
      data-state="instant-open"
      class="fixed left-(--mouse-x) top-(--mouse-y) -translate-x-1/2 pointer-events-none z-50 select-none shadow-xs transition-opacity px-3 py-2 rounded-lg border-white/10 dark:border bg-gray-950 max-w-xs"
    >
      <span class="flex items-center whitespace-pre-wrap font-semibold normal-case text-center text-gray-100 text-sm">
        {content}
      </span>
      {/* <span style="position: absolute; top: 0px; transform-origin: center 0px; transform: rotate(180deg); left: 55px;"> */}
      {/*   <div */}
      {/*     class="relative top-[-4px] h-2 w-2 rotate-45 transform shadow-xs dark:border-r dark:border-b border-white/10 bg-gray-950" */}
      {/*     width="10" */}
      {/*     height="5" */}
      {/*     viewbox="0 0 30 10" */}
      {/*     preserveaspectratio="none" */}
      {/*     style="display: block;" */}
      {/*   ></div> */}
      {/* </span> */}
    </div>
  )
}

//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     width="32"
//                     height="32"
//                     viewBox="0 0 24 24"
//                   >
//                     <g
//                       fill="none"
//                       stroke="currentColor"
//                       stroke-linecap="round"
//                       stroke-linejoin="round"
//                       stroke-width="1.5"
//                       color="currentColor"
//                     >
//                       <path d="M13.5 5.5V2m0 10V9m0 13c6 0 7.5-4.51 7.5-10S19.5 2 13.5 2S6 6.51 6 12s1.5 10 7.5 10" />
//                       <path d="M15 7c0-.466 0-.699-.076-.883a1 1 0 0 0-.541-.54c-.184-.077-.417-.077-.883-.077s-.699 0-.883.076a1 1 0 0 0-.54.541C12 6.301 12 6.534 12 7v.5c0 .466 0 .699.076.883a1 1 0 0 0 .541.54c.184.077.417.077.883.077s.699 0 .883-.076a1 1 0 0 0 .54-.541C15 8.199 15 7.966 15 7.5zm-9 5h15M5 3.167L4.619 2m-.59 3.567L3 6" />
//                     </g>
//                   </svg>
//
