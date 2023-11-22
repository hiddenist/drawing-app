export type StaticLengthArray<N extends number, T, R extends readonly T[] = []> = R["length"] extends N
  ? R
  : StaticLengthArray<N, T, [T, ...tail: R]>

export type FlattenArray<T extends [][]> = T extends [infer F, ...infer R]
  ? F extends any[]
    ? [...Flatten<F>, ...Flatten<R>]
    : [F, ...Flatten<R>]
  : []

export type VectorArray<Size extends number> = StaticLengthArray<Size, number>

export type MatrixArray<Rows extends number, Cols extends number = Rows> = StaticLengthArray<Rows, VectorArray<Cols>>
export type FlatMatrixArray<Rows extends number, Cols extends number = Rows> = FlattenArray<Matrix<Rows, Cols>>
