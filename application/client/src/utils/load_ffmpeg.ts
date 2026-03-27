import { FFmpeg } from "@ffmpeg/ffmpeg";

const FFMPEG_CORE_VERSION = "0.12.10";
const CORE_JS_URL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd/ffmpeg-core.js`;
const CORE_WASM_URL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd/ffmpeg-core.wasm`;

async function toBlobURL(url: string, mimeType: string): Promise<string> {
  const response = await fetch(url);
  if (response.ok !== true) {
    throw new Error(`Failed to fetch ffmpeg asset: ${url}`);
  }

  const buffer = await response.arrayBuffer();
  return URL.createObjectURL(new Blob([buffer], { type: mimeType }));
}

export async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: await toBlobURL(CORE_JS_URL, "text/javascript"),
    wasmURL: await toBlobURL(CORE_WASM_URL, "application/wasm"),
  });

  return ffmpeg;
}
