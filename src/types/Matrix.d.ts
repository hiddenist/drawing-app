import type { StaticLengthArray, FlattenArray } from "./Array"
import type { Vector } from "./Vector"

export type Matrix<Rows extends number, Cols extends number = Rows> = StaticLengthArray<Rows, Vector<Cols>>
export type FlatMatrix<Rows extends number, Cols extends number = Rows> = FlattenArray<Matrix<Rows, Cols>>
