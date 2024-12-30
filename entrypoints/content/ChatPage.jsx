export function DiffWithPrevButton({ onClick }) {
  return (
    <span>
      <button
        class="rounded-lg text-token-text-secondary hover:bg-token-main-surface-secondary"
        aria-label="Awooga booga"
        onclick={onClick}
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
    </span>
  )
}