declare module "polyline-normals" {
  export default function getNormals(
    points: ReadonlyArray<[x: number, y: number]>,
    closed?: boolean,
  ): ReadonlyArray<[[nx: number, ny: number], miterLength: number]>
}
