import { GifWriter } from "omggif";

interface Options {
  extension: string;
  size?: number | undefined;
}

const FPS = 10;
const MAX_DURATION_SECONDS = 5;
const FRAME_DELAY_CENTISECONDS = 100 / FPS;

function buildPalette(): number[] {
  const palette: number[] = [];

  for (let r = 0; r < 8; r += 1) {
    for (let g = 0; g < 8; g += 1) {
      for (let b = 0; b < 4; b += 1) {
        const rr = Math.round((r * 255) / 7);
        const gg = Math.round((g * 255) / 7);
        const bb = Math.round((b * 255) / 3);
        palette.push((rr << 16) | (gg << 8) | bb);
      }
    }
  }

  return palette;
}

const PALETTE = buildPalette();

function rgbaToIndexedPixels(data: Uint8ClampedArray): number[] {
  const pixels = new Array<number>(data.length / 4);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    const rBin = Math.min(7, Math.floor((r / 256) * 8));
    const gBin = Math.min(7, Math.floor((g / 256) * 8));
    const bBin = Math.min(3, Math.floor((b / 256) * 4));

    pixels[p] = (rBin << 5) | (gBin << 2) | bBin;
  }

  return pixels;
}

function createVideoFromFile(file: File): Promise<{ video: HTMLVideoElement; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.src = objectUrl;

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
    };

    video.onloadedmetadata = () => {
      cleanup();
      resolve({ video, objectUrl });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("動画の読み込みに失敗しました"));
    };
  });
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleSeeked = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("動画フレームの取得に失敗しました"));
    };

    const cleanup = () => {
      video.onseeked = null;
      video.onerror = null;
    };

    video.onseeked = handleSeeked;
    video.onerror = handleError;
    video.currentTime = time;
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function selectMp4MimeType(): string {
  const candidates = ["video/mp4;codecs=avc1.42E01E", "video/mp4"];

  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  throw new Error("このブラウザは mp4 の書き出しに対応していません");
}

async function convertMovieToMp4(
  video: HTMLVideoElement,
  outputSize: number,
  sx: number,
  sy: number,
  cropSize: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D context の初期化に失敗しました");
  }

  const mimeType = selectMp4MimeType();
  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 1_200_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const stopped = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => {
      resolve();
    };

    recorder.onerror = () => {
      reject(new Error("動画の書き出しに失敗しました"));
    };
  });

  const duration = Number.isFinite(video.duration)
    ? Math.min(MAX_DURATION_SECONDS, video.duration)
    : MAX_DURATION_SECONDS;
  const frameCount = Math.max(1, Math.floor(duration * FPS));

  recorder.start();

  for (let i = 0; i < frameCount; i += 1) {
    const time = Math.min(duration, i / FPS);
    await seekVideo(video, time);

    context.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, outputSize, outputSize);

    // MediaRecorder は実時間ベースでエンコードするため、フレーム間隔を一定に保つ。
    await wait(1000 / FPS);
  }

  recorder.stop();
  await stopped;

  return new Blob(chunks, { type: mimeType });
}

/**
 * 先頭 5 秒のみ、正方形にくり抜かれた無音動画を作成します
 */
export async function convertMovie(file: File, options: Options): Promise<Blob> {
  if (options.extension !== "gif" && options.extension !== "mp4") {
    throw new Error(`Unsupported extension: ${options.extension}`);
  }

  const { video, objectUrl } = await createVideoFromFile(file);

  try {
    const cropSize = Math.min(video.videoWidth, video.videoHeight);
    const outputSize = options.size ?? cropSize;
    const sx = Math.floor((video.videoWidth - cropSize) / 2);
    const sy = Math.floor((video.videoHeight - cropSize) / 2);

    if (options.extension === "mp4") {
      return await convertMovieToMp4(video, outputSize, sx, sy, cropSize);
    }

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context === null) {
      throw new Error("Canvas 2D context の初期化に失敗しました");
    }

    const duration = Number.isFinite(video.duration)
      ? Math.min(MAX_DURATION_SECONDS, video.duration)
      : MAX_DURATION_SECONDS;
    const frameCount = Math.max(1, Math.floor(duration * FPS));

    const estimatedSize = outputSize * outputSize * frameCount + 1024 * 1024;
    const outputBuffer = new Uint8Array(estimatedSize);
    const writer = new GifWriter(outputBuffer, outputSize, outputSize, {
      loop: 0,
      palette: PALETTE,
    });

    for (let i = 0; i < frameCount; i += 1) {
      const time = Math.min(duration, i / FPS);
      await seekVideo(video, time);

      context.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, outputSize, outputSize);
      const imageData = context.getImageData(0, 0, outputSize, outputSize);
      const indexedPixels = rgbaToIndexedPixels(imageData.data);

      writer.addFrame(0, 0, outputSize, outputSize, indexedPixels, {
        delay: FRAME_DELAY_CENTISECONDS,
      });
    }

    const writtenBytes = writer.end();
    const blob = new Blob([outputBuffer.slice(0, writtenBytes)], {
      type: "image/gif",
    });

    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  }
}
