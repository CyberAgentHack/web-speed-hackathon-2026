declare module "gifler" {
  import type { GifReader, Frame } from "omggif";

  interface FrameWithPixels extends Frame {
    pixels: Uint8ClampedArray;
  }

  class Animator {
    constructor(reader: GifReader, frames: FrameWithPixels[]);
    start(): void;
    stop(): void;
    reset(): void;
    running(): boolean;
    animateInCanvas(canvas: HTMLCanvasElement): void;
    onFrame(frame: FrameWithPixels): void;
  }

  class Gif {
    animate(selector: HTMLCanvasElement | string): Promise<Animator>;
    get(): Promise<Animator>;
  }

  class Decoder {
    static decodeFramesSync(reader: GifReader): FrameWithPixels[];
  }

  function gifler(url: string): Gif;

  export default gifler;
  export { Animator, Decoder };
}
