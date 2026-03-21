import { FFmpeg } from "@ffmpeg/ffmpeg";

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  const [coreBinary, wasmBinary] = await Promise.all([
    import("@ffmpeg/core?binary").then(({ default: b }) => b),
    import("@ffmpeg/core/wasm?binary").then(({ default: b }) => b),
  ]);

  const coreURL = URL.createObjectURL(new Blob([coreBinary], { type: "text/javascript" }));
  const wasmURL = URL.createObjectURL(new Blob([wasmBinary], { type: "application/wasm" }));

  try {
    await ffmpeg.load({ coreURL, wasmURL });
  } finally {
    URL.revokeObjectURL(coreURL);
    URL.revokeObjectURL(wasmURL);
  }

  return ffmpeg;
}
