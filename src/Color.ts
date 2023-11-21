export class Color {
  public readonly r: number;
  public readonly g: number;
  public readonly b: number;
  public readonly a: number;

  static readonly BLACK = new Color(0, 0, 0);
  static readonly WHITE = new Color(255, 255, 255);

  public constructor(r: number, g: number, b: number, a = 1) {
    this.r = r % 256;
    this.g = g % 256;
    this.b = b % 256;
    this.a = a;
  }

  public toVector4(): number[] {
    return [this.r / 255, this.g / 255, this.b / 255, this.a];
  }
}