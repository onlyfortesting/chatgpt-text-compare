export function getCursorPosition(root, selection = getSelection()) {
  let node = selection.anchorNode
  let walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

  let n
  let pos = selection.anchorOffset
  while ((n = walker.nextNode()) && n !== node) {
    pos += n.length
  }

  return pos
}

export function getCursorNode(root, index) {
  let walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

  let n
  let pos = 0
  while (pos < index) {
    n = walker.nextNode()
    pos += n.length
  }

  return {
    anchorNode: n || walker.nextNode(),
    anchorOffset: n ? n.length - (pos - index) : 0,
  }
}

export function setCursor(node, startIndex, endIndex) {
  let sel = getSelection()
  let start = getCursorNode(node, startIndex)
  let end = getCursorNode(node, endIndex)
  let range = document.createRange()

  if (start.anchorNode) {
    range.setStart(start.anchorNode, start.anchorOffset)
    range.setEnd(end.anchorNode, end.anchorOffset)
  } else {
    range.setStart(node, 0)
  }

  sel.removeAllRanges()
  sel.addRange(range)
}

export const caret = (el) => {
  const range = window.getSelection().getRangeAt(0)
  const prefix = range.cloneRange()
  prefix.selectNodeContents(el)
  prefix.setEnd(range.endContainer, range.endOffset)
  return prefix.toString().length
}

export const setCaret = (parent, pos) => {
  for (const node of parent.childNodes) {
    if (node.nodeType == Node.TEXT_NODE) {
      if (node.length >= pos) {
        const range = document.createRange()
        const sel = window.getSelection()
        range.setStart(node, pos)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        return -1
      } else {
        pos = pos - node.length
      }
    } else {
      pos = setCaret(node, pos)
      if (pos < 0) {
        return pos
      }
    }
  }
  return pos
}
