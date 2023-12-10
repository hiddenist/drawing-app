export declare global {
  declare namespace JSX {
    interface IntrinsicElements {
      div: HTMLProps<HTMLDivElement>
      span: HTMLProps<HTMLSpanElement>
      button: HTMLProps<HTMLButtonElement>
      input: HTMLProps<HTMLInputElement>
      textarea: HTMLProps<HTMLTextAreaElement>
      canvas: HTMLProps<HTMLCanvasElement>
      [eleName: string]: unknown
    }
    type Element<T extends HTMLElement> = T
  }
}

type WithMappedEventHandlers<T extends HTMLElement> = {
  [K in keyof EventHandlerCaseMap]?: EventHandlerCaseMap[K] extends keyof T ? T[EventHandlerCaseMap[K]] : never
}
type HTMLPropsWithoutEventHandlers<T extends HTMLElement> = Without<T, EventHandlerCaseMap[keyof EventHandlerCaseMap]>
type HTMLProps<T extends HTMLElement> = Partial<WithPartial<HTMLPropsWithoutEventHandlers<T>, "style"> & WithRef<T>> &
  WithMappedEventHandlers<T>

type WithRef<T extends HTMLElement> = {
  ref: (element: T) => void
}

type Without<T, E> = {
  [K in keyof T as T[K] extends E ? never : K]: T[K]
}

type WithPartial<T, P extends keyof T> = {
  [K in keyof T]: K extends P ? Partial<T[K]> : T[K]
}

type EventHandlerCaseMap = {
  onBlur: "onblur"
  onChange: "onchange"
  onClick: "onclick"
  onContextMenu: "oncontextmenu"
  onDoubleClick: "ondblclick"
  onDrag: "ondrag"
  onDragEnd: "ondragend"
  onDragEnter: "ondragenter"
  onDragExit: "ondragexit"
  onDragLeave: "ondragleave"
  onDragOver: "ondragover"
  onDragStart: "ondragstart"
  onDrop: "ondrop"
  onFocus: "onfocus"
  onInput: "oninput"
  onKeyDown: "onkeydown"
  onKeyPress: "onkeypress"
  onKeyUp: "onkeyup"
  onLoad: "onload"
  onMouseDown: "onmousedown"
  onMouseEnter: "onmouseenter"
  onMouseLeave: "onmouseleave"
  onMouseMove: "onmousemove"
  onMouseOut: "onmouseout"
  onMouseOver: "onmouseover"
  onMouseUp: "onmouseup"
  onScroll: "onscroll"
  onSelect: "onselect"
  onTouchCancel: "ontouchcancel"
  onTouchEnd: "ontouchend"
  onTouchMove: "ontouchmove"
  onTouchStart: "ontouchstart"
  onWheel: "onwheel"

  // Special cases
  onCopy: "oncopy"
  onCut: "oncut"
  onPaste: "onpaste"
  onCompositionEnd: "oncompositionend"
  onCompositionStart: "oncompositionstart"
  onCompositionUpdate: "oncompositionupdate"
  onGotPointerCapture: "ongotpointercapture"
  onLostPointerCapture: "onlostpointercapture"
  onPointerCancel: "onpointercancel"
  onPointerDown: "onpointerdown"
  onPointerEnter: "onpointerenter"
  onPointerLeave: "onpointerleave"
  onPointerMove: "onpointermove"
  onPointerOut: "onpointerout"
  onPointerOver: "onpointerover"
  onPointerUp: "onpointerup"
  onGotFocus: "ongotfocus"
  onLostFocus: "onlostfocus"
  onInvalid: "oninvalid"
  onReset: "onreset"
  onSearch: "onsearch"
  onSubmit: "onsubmit"
  onToggle: "ontoggle"
  onAbort: "onabort"
  onCanPlay: "oncanplay"
  onCanPlayThrough: "oncanplaythrough"
  onDurationChange: "ondurationchange"
  onEmptied: "onemptied"
  onEncrypted: "onencrypted"
  onEnded: "onended"
  onError: "onerror"
  onLoadedData: "onloadeddata"
  onLoadedMetadata: "onloadedmetadata"
  onLoadStart: "onloadstart"
  onPause: "onpause"
  onPlay: "onplay"
  onPlaying: "onplaying"
  onProgress: "onprogress"
  onRateChange: "onratechange"
  onSeeked: "onseeked"
  onSeeking: "onseeking"
  onStalled: "onstalled"
  onSuspend: "onsuspend"
  onTimeUpdate: "ontimeupdate"
  onVolumeChange: "onvolumechange"
  onWaiting: "onwaiting"
  onAnimationStart: "onanimationstart"
  onAnimationEnd: "onanimationend"
  onAnimationIteration: "onanimationiteration"
  onTransitionEnd: "ontransitionend"
}
