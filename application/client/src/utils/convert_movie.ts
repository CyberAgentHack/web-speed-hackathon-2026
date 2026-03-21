import { GifWriter } from "omggif";

import { buildColorMap, buildPalette, mapPixels } from "@web-speed-hackathon-2026/client/src/utils/quantize";

interface Options {
  extension: string;
  size?: number | undefined;
}

/**
 * 先頭 5 秒のみ、正方形にくり抜かれた無音動画を作成します
 */
export async function convertMovie(file: File, _options: Options): Promise<Blob> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error("Failed to load video"));
  });

  const duration = Math.min(video.duration, 5);
  const fps = 10;
  const frameCount = Math.max(1, Math.ceil(duration * fps));

  const srcSize = Math.min(video.videoWidth, video.videoHeight);
  const cropX = Math.floor((video.videoWidth - srcSize) / 2);
  const cropY = Math.floor((video.videoHeight - srcSize) / 2);
  const outSize = _options.size ?? srcSize;

  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d")!;

  // Extract frames by seeking
  const frames: ImageData[] = [];
  for (let i = 0; i < frameCount; i++) {
    video.currentTime = i / fps;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });
    ctx.drawImage(video, cropX, cropY, srcSize, srcSize, 0, 0, outSize, outSize);
    frames.push(ctx.getImageData(0, 0, outSize, outSize));
  }

  URL.revokeObjectURL(video.src);

  // Build global palette and color map
  const palette = buildPalette(frames, 256);
  const colorMap = buildColorMap(palette);

  // Encode GIF
  const bufSize = outSize * outSize * frameCount + 1024 * frameCount + 4096;
  const buf = new Uint8Array(bufSize);
  const writer = new GifWriter(buf, outSize, outSize, {
    loop: 0,
    palette,
  });

  for (const frame of frames) {
    const indexed = mapPixels(frame.data, colorMap);
    writer.addFrame(0, 0, outSize, outSize, indexed, { delay: 10 });
  }

  const offset = writer.end();
  return new Blob([buf.slice(0, offset)], { type: "image/gif" });
}
