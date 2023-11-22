export type StaticLengthArray<N extends number, T, R extends readonly T[] = []> = R["length"] extends N
  ? R
  : StaticLengthArray<N, T, [T, ...tail: R]>

export type FlattenArray<T extends [][]> = T extends [infer F, ...infer R]
  ? F extends any[]
    ? [...Flatten<F>, ...Flatten<R>]
    : [F, ...Flatten<R>]
  : []
