import { EditableNumericLabel } from "./EditableNumericLabel"
import { adjustNumberOnScroll } from "../helpers/adjustNumberOnScroll"

interface SliderInputProps {
  onChange: (value: number) => void
  getDisplayValue: (value: number) => string
  labelAppend?: string
  label: string
  initialValue: number
  min: number
  max: number
  className?: string
}

export function SliderInput(props: SliderInputProps) {
  let editableLabelRef: null | HTMLSpanElement = null
  let inputRef: null | HTMLInputElement = null
  const data = {
    currentValue: props.initialValue,
  }

  const setEditableLabel = (value: number) => {
    if (!editableLabelRef) {
      return
    }
    editableLabelRef.innerText = props.getDisplayValue(value)
  }

  const setValue = (rawValue: number | string) => {
    let value = rawValue
    if (typeof value === "string") {
      value = value ? 0 : parseInt(value)
    }
    if (isNaN(value)) {
      value = 0
    }
    if (value < props.min) {
      value = props.min
    }
    if (value > props.max) {
      value = props.max
    }
    setEditableLabel(value)
    if (inputRef) inputRef.value = value.toString()
    props.onChange(value)
    data.currentValue = value
  }

  const labelElem = (
    <span>
      {props.label}:{" "}
      <EditableNumericLabel
        ref={(elem) => {
          editableLabelRef = elem
        }}
        onChange={(value) => {
          if (typeof value === "function") {
            setValue(value(data.currentValue))
          } else {
            setValue(value)
          }
        }}
        onCancel={() => {
          setEditableLabel(data.currentValue)
        }}
        displayValue={props.getDisplayValue(props.initialValue)}
      />
      {props.labelAppend}
    </span>
  )

  const inputElem = (
    <input
      type="range"
      max={props.max.toString()}
      min={props.min.toString()}
      value={props.initialValue.toString()}
      ref={(elem) => {
        inputRef = elem
      }}
      onchange={(e) => {
        const target = e.target as HTMLInputElement
        setValue(parseInt(target.value))
      }}
      onwheel={(e) => {
        setValue(adjustNumberOnScroll(e, data.currentValue))
      }}
    />
  )

  return (
    <label className={`slider ${props.className}`}>
      {labelElem}
      {inputElem}
    </label>
  )
}
