export type StaticLengthArray<N extends number, T, R extends readonly T[] = []> = R["length"] extends N
  ? R
  : StaticLengthArray<N, T, [T, ...tail: R]>

export type FlattenArray<T extends any[]> = T extends [infer F, ...infer R]
  ? F extends any[]
    ? [...FlattenArray<F>, ...FlattenArray<R>]
    : [F, ...FlattenArray<R>]
  : []

export type VectorArray<Size extends number> = StaticLengthArray<Size, number>

export type MatrixArray<Rows extends number, Cols extends number = Rows> = StaticLengthArray<Rows, VectorArray<Cols>>
export type FlatMatrixArray<Rows extends number, Cols extends number = Rows> = FlattenArray<MatrixArray<Rows, Cols>>

export type Vec2 = VectorArray<2>
export type Vec3 = VectorArray<3>
export type Vec4 = VectorArray<4>

export type Mat2 = FlatMatrixArray<2>
export type Mat3 = FlatMatrixArray<3>
export type Mat4 = FlatMatrixArray<4>
export type Mat2x3 = FlatMatrixArray<2, 3>
export type Mat3x2 = FlatMatrixArray<3, 2>
export type Mat2x4 = FlatMatrixArray<2, 4>
export type Mat4x2 = FlatMatrixArray<4, 2>
export type Mat3x4 = FlatMatrixArray<3, 4>
export type Mat4x3 = FlatMatrixArray<4, 3>
