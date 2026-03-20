declare module "gifler" {
  import type { GifReader, Frame } from "omggif";

  interface FrameWithPixels extends Frame {
    pixels: Uint8ClampedArray;
  }

  class Animator {
    constructor(reader: GifReader, frames: FrameWithPixels[]);
    start(): void;
    stop(): void;
    animateInCanvas(canvas: HTMLCanvasElement): void;
    onFrame(frame: FrameWithPixels): void;
  }

  class Decoder {
    static decodeFramesSync(reader: GifReader): FrameWithPixels[];
  }

  export { Animator, Decoder };
}
