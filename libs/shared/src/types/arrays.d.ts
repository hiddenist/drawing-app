/**
 * An array with a static length.
 */
export type ArrayOfLength<N extends number, T, R extends T[] = []> = R["length"] extends N
  ? R
  : ArrayOfLength<N, T, [T, ...tail: R]>

/**
 * The type of an array after it's been flattened.
 */
export type FlatArray<T extends any[]> = T extends [infer F, ...infer R]
  ? F extends any[]
    ? [...FlatArray<F>, ...FlatArray<R>]
    : [F, ...FlatArray<R>]
  : T

/**
 * An array of numbers with a static length.
 */
export type VectorArray<Size extends number> = ArrayOfLength<Size, number>

type Vec2 = VectorArray<2>

/**
 * A two dimensional array of numbers with static lengths.
 */
export type MatrixArray<Rows extends number, Cols extends number = Rows> = ArrayOfLength<Rows, VectorArray<Cols>>

/**
 * A flattened two dimensional array of numbers with static lengths.
 */
export type FlatMatrixArray<Rows extends number, Cols extends number = Rows> = FlatArray<MatrixArray<Rows, Cols>>
