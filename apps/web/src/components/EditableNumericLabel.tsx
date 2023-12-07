export function EditableNumericLabel(props: {
  data: { currentValue: number },
  displayValue: string,
  onChange: (value: number) => void,
  onCancel: () => void,
  ref?: (elem: HTMLSpanElement) => void
}) {
  return (
    <span 
      style={{ caretColor: "currentColor" }}
      contentEditable="plaintext-only"
      ref={props.ref}
      onkeydown={(ev) => {
        const e = ev as KeyboardEvent
        const target = e.target as HTMLSpanElement
        if (e.key === "ArrowUp") {
          e.preventDefault()
          const value = parseInt(target.innerText)
          if (isNaN(value)) {
            return
          }
          props.onChange(value + 1)
        } else if (e.key === "ArrowDown") {
          e.preventDefault()
          const value = parseInt(target.innerText)
          if (isNaN(value)) {
            return
          }
          props.onChange(value - 1)
        } else if (e.key === "Enter") {
          e.preventDefault()
          target.blur()
        } else if (e.key === "Escape") {
          e.preventDefault()
          target.blur()
          props.onCancel()
        } else if (e.key.length === 1 && isNaN(parseInt(e.key))) {
          e.preventDefault()
        }
      }}
      onclick={(ev) => {
        const e = ev as MouseEvent
        const target = e.target as HTMLSpanElement
        e.preventDefault()
        target.focus()
        // place caret at end of text
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(target)
        sel?.removeAllRanges()
        sel?.addRange(range)
      }}
      onwheel={(ev) => {
        const e = ev as WheelEvent
        const target = e.target as HTMLSpanElement
        e.preventDefault()
        const value = parseInt(target.innerText)
        if (isNaN(value)) {
          return
        }
        const delta = e.deltaY > 0 ? -1 : 1
        props.onChange(value + delta)
      }}
      onpaste={(ev) => {
        const e = ev as ClipboardEvent
        const target = e.target as HTMLSpanElement
        e.preventDefault()
        if (!e.clipboardData) {
          return
        }
        const text = e.clipboardData.getData("text/plain")
        const value = parseInt(text)
        props.onChange(value)
      }}
      onblur={(ev) => {
        const e = ev as FocusEvent
        const target = e.target as HTMLSpanElement
        const value = parseInt(target.innerText)
        props.onChange(value)
      }}
    >
      {props.displayValue}
    </span>
  )
}