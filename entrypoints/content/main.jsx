import { diffWordsWithSpace } from "diff"

export function compare(a, b) {
  let diff = diffWordsWithSpace(a, b)
  // console.log(diff)

  /** Copyright https://github.com/EllAchE
   * https://github.com/kpdecker/jsdiff/issues/528
   */
  function mergeChanges(changes) {
    // create accumulators for the added and removed text. Once a neutral
    // part is encountered, merge the diffs and reset the accumulators
    let addedText = ""
    let addedCount = 0
    let removedText = ""
    let removedCount = 0
    let mergedChanges = []

    for (const part of changes) {
      if (part?.added) {
        addedText += part.value
        addedCount += part.count ?? 0
      } else if (part?.removed) {
        removedText += part.value
        removedCount += part.count ?? 0
      } else if (part.value.length <= 5) {
        // we ignore small unchanged segments (<= 4 characters),
        // which catches most whitespace too
        addedText += part.value
        removedText += part.value
      } else {
        // if the part is not added or removed, merge the added and removed text
        // and append to the diff alongside neutral text
        mergedChanges.push({
          value: removedText,
          removed: true,
          count: removedCount,
        })
        mergedChanges.push({
          value: addedText,
          added: true,
          count: addedCount,
        })
        mergedChanges.push(part)

        addedText = ""
        addedCount = 0
        removedText = ""
        removedCount = 0
      }
    }

    // after exiting the loop we might have ended with some added or removed text
    // that needs to be appended
    if (addedText) {
      mergedChanges.push({ value: addedText, added: true, count: addedCount })
    }
    if (removedText) {
      mergedChanges.push({
        value: removedText,
        removed: true,
        count: removedCount,
      })
    }

    return mergedChanges
  }

  return mergeChanges(diff)
}

export async function createDiffHtml(changes, storeKey) {
  // Remove unused field to save storage space
  changes.forEach((c) => delete c.count)

  let addremove = changes.filter((c) => c.value)

  function checkResolve() {
    const isResolved = !addremove.some((c) => c.added || c.removed)
    if (isResolved) {
      console.log("clear", storeKey)
      storage.removeItem(storeKey)
    }
  }

  let diffHtml = changes
    .filter((c) => c.value)
    .map((c, i, a) => {
      let value = c.value

      if (!c.added && !c.removed) return value
      else if (c.added) {
        return (
          <span
            class="added bg-green-400/40 cursor-pointer hover:bg-green-400/50"
            onclick={(e) => {
              let prev = e.currentTarget.previousSibling
              if (prev.matches?.(".removed")) {
                prev.remove()

                addremove.splice(addremove.indexOf(c) - 1, 1)
              }

              e.currentTarget.replaceWith(e.currentTarget.textContent)

              addremove.splice(addremove.indexOf(c), 1, {
                value: e.currentTarget.textContent,
              })

              storage.setItem(storeKey, addremove)

              checkResolve()
            }}
          >
            {value}
          </span>
        )
      } else if (c.removed) {
        return (
          <span
            class={`removed bg-red-400/40 ${value.trim() ? "line-through" : ""} cursor-pointer [&:not([data-single]):hover]:no-underline data-[single]:hover:bg-red-400/60`}
            data-single={!a[i + 1]?.added || null}
            onclick={(e) => {
              let next = e.currentTarget.nextSibling
              if (next.matches?.(".added")) {
                next.remove()
                e.currentTarget.replaceWith(e.currentTarget.textContent)

                addremove.splice(addremove.indexOf(c) + 1, 1)
                addremove.splice(addremove.indexOf(c), 1, {
                  value: e.currentTarget.textContent,
                })
              } else {
                e.currentTarget.remove()

                addremove.splice(addremove.indexOf(c), 1)
              }

              storage.setItem(storeKey, addremove)

              checkResolve()
            }}
          >
            {value}
          </span>
        )
      }
    })

  return diffHtml
}
