import { Decoder } from "gifler";
import { GifReader } from "omggif";

export interface GifDecoderResult {
  width: number;
  height: number;
  frames: Array<{
    data: Uint8ClampedArray;
    delay: number;
  }>;
}

self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
  const reader = new GifReader(new Uint8Array(e.data));
  const rawFrames = Decoder.decodeFramesSync(reader);

  const result: GifDecoderResult = {
    width: reader.width,
    height: reader.height,
    frames: rawFrames.map((f) => ({
      data: f.pixels,
      delay: f.delay,
    })),
  };

  const transferables = result.frames.map((f) => f.data.buffer);
  (self as unknown as Worker).postMessage(result, transferables);
};
