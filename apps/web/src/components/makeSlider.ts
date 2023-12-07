export function makeSlider(options: {
  onChange: (value: number) => void
  getDisplayValue: (value: number) => string
  labelAppend?: string
  label: string
  initialValue: number
  min: number
  max: number
  className?: string
}) {
  const label = document.createElement("label")
  const input = document.createElement("input")
  const labelText = document.createElement("span")
  const labelTextEditable = document.createElement("span")

  if (options.className) {
    label.classList.add(options.className)
  }
  label.classList.add("slider")

  const setValue = (rawValue: number | string) => {
    let value = rawValue
    if (typeof value === "string") {
      value = value ? 0 : parseInt(value)
    }
    if (isNaN(value)) {
      value = 0
    }
    if (value < options.min) {
      value = options.min
    }
    if (value > options.max) {
      value = options.max
    }
    options.onChange(value)
    labelTextEditable.innerText = options.getDisplayValue(value)
    input.value = value.toString()
    options.onChange(value)
  }

  labelText.innerText = `${options.label}: `
  labelText.append(labelTextEditable)
  if (options.labelAppend) {
    labelText.append(options.labelAppend)
  }
  label.append(labelText)
  label.append(input)

  labelTextEditable.innerText = options.getDisplayValue(options.initialValue)

  // plaintext only contenteditable
  try {
    labelTextEditable.contentEditable = "plaintext-only"
  } catch {
    labelTextEditable.contentEditable = "true"
  }

  labelTextEditable.style.caretColor = "currentColor"
  labelTextEditable.addEventListener("click", (e) => {
    e.preventDefault()
    labelTextEditable.focus()
    // place caret at end of text
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(labelTextEditable)
    sel?.removeAllRanges()
    sel?.addRange(range)
  })
  labelTextEditable.addEventListener("wheel", (e) => {
    e.preventDefault()
    const value = parseInt(labelTextEditable.innerText)
    if (isNaN(value)) {
      return
    }
    const delta = e.deltaY > 0 ? -1 : 1
    setValue(value + delta)
  })
  labelTextEditable.addEventListener("paste", (e) => {
    e.preventDefault()
    if (!e.clipboardData) {
      return
    }
    const text = e.clipboardData.getData("text/plain")
    const value = parseInt(text)
    setValue(value)
  })
  labelTextEditable.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      const value = parseInt(labelTextEditable.innerText)
      if (isNaN(value)) {
        return
      }
      setValue(value + 1)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const value = parseInt(labelTextEditable.innerText)
      if (isNaN(value)) {
        return
      }
      setValue(value - 1)
    } else if (e.key === "Enter") {
      e.preventDefault()
      labelTextEditable.blur()
    } else if (e.key === "Escape") {
      e.preventDefault()
      labelTextEditable.innerText = input.value
      labelTextEditable.blur()
    } else if (e.key.length === 1 && isNaN(parseInt(e.key))) {
      e.preventDefault()
    }
  })
  labelTextEditable.addEventListener("blur", () => {
    const value = parseInt(labelTextEditable.innerText)
    setValue(value)
  })

  input.type = "range"
  input.max = options.max.toString()
  input.min = options.min.toString()
  input.value = options.initialValue.toString()
  input.addEventListener("change", () => {
    setValue(parseInt(input.value))
  })
  input.addEventListener("wheel", (e) => {
    e.preventDefault()
    const value = parseInt(input.value)
    if (isNaN(value)) {
      return
    }
    const delta = e.deltaY > 0 ? -1 : 1
    setValue(value + delta)
  })

  return { element: label, label, input }
}
