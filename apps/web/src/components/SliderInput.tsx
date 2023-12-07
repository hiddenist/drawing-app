import { EditableNumericLabel } from "./EditableNumericLabel"

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
    let editableLabelRef: null | HTMLSpanElement = null;
    let inputRef: null | HTMLInputElement = null;
    const data = {
      currentValue: props.initialValue
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
    }

    return (
        <label className={`slider ${props.className}`}>
            <span>{props.label}:{" "}
                <EditableNumericLabel 
                  ref={(elem) => {
                    editableLabelRef = elem
                  }}
                  onChange={(value) => {
                    setValue(value)
                  }}
                  onCancel={() => {
                    setEditableLabel(data.currentValue)
                  }}
                  data={data}
                  displayValue={props.getDisplayValue(props.initialValue)}
                />
                {props.labelAppend}
            </span>
            <input
              type="range"
              max={props.max.toString()}
              min={props.min.toString()}
              value={props.initialValue.toString()}
              ref={(elem) => {
                inputRef = elem
              }}
              onchange={(ev) => {
                const e = ev as Event
                const target = e.target as HTMLInputElement
                setValue(parseInt(target.value))
              }}
              onwheel={(ev) => {
                const e = ev as WheelEvent
                const target = e.target as HTMLInputElement
                e.preventDefault()
                const value = parseInt(target.value)
                if (isNaN(value)) {
                  return
                }
                const delta = e.deltaY > 0 ? -1 : 1
                setValue(value + delta)
              }}
            />
        </label>
    )
}
