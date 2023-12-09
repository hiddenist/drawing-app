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

type PropsWithoutFunctions<T extends HTMLElement> = Without<T, Function>
type HTMLProps<T extends HTMLElement> = Partial<PropsWithoutFunctions<WithPartial<T, "style">> & WithRef<T>>

type WithRef<T extends HTMLElement> = {
  ref: (element: T) => void
}

type Without<T, E> = {
  [K in keyof T as T[K] extends E ? never : K]: T[K]
}

type WithPartial<T, P extends keyof T> = {
  [K in keyof T]: K extends P ? Partial<T[K]> : T[K]
}
