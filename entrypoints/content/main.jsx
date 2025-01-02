import { diffWordsWithSpace } from "diff"
import { getCursorPosition, setCursor } from "./utils"

export function compare(a, b) {
  let diff = diffWordsWithSpace(a, b)
  console.log(diff)

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

  // console.log(mergeChanges(diff).filter((c) => c.count))

  let diffHtml = mergeChanges(diff)
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
              if (prev.matches?.(".removed")) prev.remove()
              e.currentTarget.replaceWith(e.currentTarget.textContent)

              let startPos = getCursorPosition(result)
              setCursor(
                result,
                startPos,
                startPos + e.currentTarget.textContent.length
              )
            }}
          >
            {value}
          </span>
        )
      } else if (c.removed) {
        return (
          <span
            class="removed bg-red-400/40 line-through cursor-pointer [&:not([data-single]):hover]:no-underline data-[single]:hover:bg-red-400/60"
            data-single={!a[i + 1]?.added || null}
            onclick={(e) => {
              let next = e.currentTarget.nextSibling
              if (next.matches?.(".added")) {
                next.remove()
                e.currentTarget.replaceWith(e.currentTarget.textContent)
              } else {
                e.currentTarget.remove()
                return
              }

              let startPos = getCursorPosition(result)
              setCursor(
                result,
                startPos,
                startPos + e.currentTarget.textContent.length
              )
            }}
          >
            {value}
          </span>
        )
      }
    })

  // console.log(diffHtml)
  return diffHtml
}