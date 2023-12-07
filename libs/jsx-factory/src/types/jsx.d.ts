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

type HTMLProps<T extends HTMLElement, E extends HTMLElementEventMap = HTMLElementEventMap> = OmitFunctions<
  Omit<Partial<T>, "style">
> & {
  [K in `on${keyof E}`]?: (event: E[K]) => void
} & {
  ref?: (element: T) => void
  style?: Partial<CSSStyleDeclaration>
}

type OmitFunctions<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K]
}
