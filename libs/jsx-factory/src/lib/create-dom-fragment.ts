type DomFragmentFactory = (
  attrs?: { [key: string]: any },
  ...children: (HTMLElement | string)[]
) => (HTMLElement | string)[]

export const createDomFragment: DomFragmentFactory = (_, ...children): (HTMLElement | string)[] => {
  return children
}
