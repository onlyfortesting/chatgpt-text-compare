export function HomePrompts({}) {
  let input

  onMount(async () => {
    input = $("._prosemirror-parent_cy42l_1 .ProseMirror")
    console.log(input)
  })

  return (
    <div class="py-10 flex flex-col gap-4">
      <h1 class="text-base">ChatGPT Text Compare:</h1>
      <div class="flex">
        <button class="group relative flex h-[42px] items-center gap-1.5 rounded-full border border-token-border-light px-3 py-2 text-start text-[13px] shadow-xxs transition enabled:hover:bg-token-main-surface-secondary disabled:cursor-not-allowed xl:gap-2 xl:text-[14px]">
          {svg(() => (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="icon-md"
              style="color: rgb(53, 174, 71);"
            >
              <path
                d="M4.5 17.5L7.56881 14.3817C8.32655 13.6117 9.55878 13.5826 10.352 14.316L16.5 20"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M19 12H18.3798C17.504 12 16.672 11.6173 16.102 10.9524L11.898 6.04763C11.328 5.38269 10.496 5 9.6202 5H6C4.89543 5 4 5.89543 4 7V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V17"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M19 5H18.3798C17.504 5 16.672 5.38269 16.102 6.04763L14 8.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor"></circle>
              <path
                d="M18 14V10C18 9.58798 18.4704 9.35279 18.8 9.6L21.4667 11.6C21.7333 11.8 21.7333 12.2 21.4667 12.4L18.8 14.4C18.4704 14.6472 18 14.412 18 14Z"
                fill="currentColor"
              ></path>
              <path
                d="M18 7V3C18 2.58798 18.4704 2.35279 18.8 2.6L21.4667 4.6C21.7333 4.8 21.7333 5.2 21.4667 5.4L18.8 7.4C18.4704 7.64721 18 7.41202 18 7Z"
                fill="currentColor"
              ></path>
            </svg>
          ))}
          <span
            class="max-w-full select-none whitespace-nowrap text-gray-600 transition group-hover:text-token-text-primary dark:text-gray-500"
            onclick={async () => {
              input.innerHTML = `<p>Fix grammar! I only need the transformed text</p>`

              await tick()

              let sendBtn = $('[data-testid="send-button"]')
              console.log(sendBtn)

              sendBtn.click()
            }}
          >
            Fix grammar
          </span>
        </button>
      </div>
    </div>
  )
}
