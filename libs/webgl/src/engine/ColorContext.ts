import { Color } from "../utils/Color"

export class ColorContext {
  private colors: [Color, Color] = [Color.BLACK, Color.WHITE]

  public get foreground(): Color {
    return this.colors[0]
  }

  public get background(): Color {
    return this.colors[1]
  }

  public set foreground(color: Color) {
    this.colors[0] = color
  }

  public set background(color: Color) {
    this.colors[1] = color
  }

  public setForeground(color: Color): ColorContext {
    this.foreground = color
    return this
  }

  public setBackground(color: Color): ColorContext {
    this.background = color
    return this
  }

  public swap(): void {
    this.colors.reverse()
  }
}
