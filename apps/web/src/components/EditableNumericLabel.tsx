import { adjustNumberOnScroll } from "../helpers/adjustNumberOnScroll"
import { isFirefox } from "../helpers/isFirefox"

export function EditableNumericLabel(props: {
  displayValue: string
  onChange: (value: number | ((currentValue: number) => number)) => void
  onCancel: () => void
  ref?: (elem: HTMLSpanElement) => void
}) {
  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault()
    if (!e.clipboardData) {
      return
    }
    const text = e.clipboardData.getData("text/plain")
    const value = parseInt(text)
    props.onChange(value)
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    const target = e.target as HTMLSpanElement

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        props.onChange((value) => value + 1)
        break
      case "ArrowDown":
        e.preventDefault()
        props.onChange((value) => value - 1)
        break
      case "Enter":
        e.preventDefault()
        target.blur()
        break
      case "Escape":
        e.preventDefault()
        target.blur()
        props.onCancel()
        break
      default:
        if (e.key.length === 1 && isNaN(parseInt(e.key))) {
          e.preventDefault()
        }
    }
  }

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLSpanElement
    e.preventDefault()
    target.focus()
    // place caret at end of text
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(target)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  const handleScrollWheel = (e: WheelEvent) => {
    e.preventDefault()
    props.onChange((value) => {
      return adjustNumberOnScroll(e, value)
    })
  }

  const handleBlur = () => {
    props.onCancel()
  }

  return (
    <span
      style={{ caretColor: "currentColor" }}
      contentEditable={isFirefox() ? "true" : "plaintext-only"}
      ref={props.ref}
      onkeydown={handleKeyPress}
      onclick={handleClick}
      onwheel={handleScrollWheel}
      onpaste={handlePaste}
      onblur={handleBlur}
    >
      {props.displayValue}
    </span>
  )
}
