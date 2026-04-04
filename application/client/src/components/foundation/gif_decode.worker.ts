import type { Frame } from "omggif";
import { GifReader } from "omggif";

interface DecodedGifFrame extends Frame {
  pixels: Uint8ClampedArray;
}

interface DecodeGifMessage {
  buffer: ArrayBuffer;
  requestId: number;
}

interface DecodedGifMessage {
  frames: DecodedGifFrame[];
  requestId: number;
}

function decodeFrames(buffer: ArrayBuffer): DecodedGifFrame[] {
  const reader = new GifReader(new Uint8Array(buffer));
  const frameIndices = Array.from({ length: reader.numFrames() }, (_, index) => index);

  return frameIndices.map((frameIndex) => {
    const frame = reader.frameInfo(frameIndex);
    const pixels = new Uint8ClampedArray(reader.width * reader.height * 4);
    reader.decodeAndBlitFrameRGBA(frameIndex, pixels);

    return {
      ...frame,
      pixels,
    };
  });
}

self.onmessage = (event: MessageEvent<DecodeGifMessage>) => {
  const { buffer, requestId } = event.data;
  const frames = decodeFrames(buffer);

  self.postMessage(
    {
      frames,
      requestId,
    } satisfies DecodedGifMessage,
    frames.map((frame) => frame.pixels.buffer),
  );
};