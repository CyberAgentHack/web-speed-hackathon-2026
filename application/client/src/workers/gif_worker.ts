import { GifReader } from "omggif";

interface Frame {
  imageData: ImageData;
  delay: number;
}

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

let frames: Frame[] = [];
let currentFrame = 0;
let timerId: ReturnType<typeof setTimeout> | null = null;
let playing = false;
let abortController: AbortController | null = null;

function decodeFrames(buffer: ArrayBuffer): Frame[] {
  const reader = new GifReader(new Uint8Array(buffer));
  const { width, height } = reader;
  const count = reader.numFrames();

  // Two OffscreenCanvases: temp receives raw frame pixels, backing composites them
  const backing = new OffscreenCanvas(width, height);
  const backingCtx = backing.getContext("2d")!;
  const temp = new OffscreenCanvas(width, height);
  const tempCtx = temp.getContext("2d")!;

  const result: Frame[] = [];

  for (let i = 0; i < count; i++) {
    const info = reader.frameInfo(i);

    // Decode frame into full-canvas pixel buffer (transparent pixels = 0,0,0,0)
    const pixels = new Uint8ClampedArray(width * height * 4);
    reader.decodeAndBlitFrameRGBA(i, pixels);

    // putImageData on temp, then drawImage onto backing for correct alpha compositing
    tempCtx.clearRect(0, 0, width, height);
    tempCtx.putImageData(new ImageData(pixels, width, height), 0, 0);
    backingCtx.drawImage(temp, 0, 0);

    result.push({
      imageData: backingCtx.getImageData(0, 0, width, height),
      delay: Math.max((info.delay || 10) * 10, 50),
    });

    // Disposal method 2: clear the frame rect for the next frame
    if (info.disposal === 2) {
      backingCtx.clearRect(info.x, info.y, info.width, info.height);
    }
  }

  return result;
}

function renderFrame() {
  if (!ctx || frames.length === 0) return;
  ctx.putImageData(frames[currentFrame]!.imageData, 0, 0);
}

function clearTimer() {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function animate() {
  if (!playing || frames.length <= 1) return;
  timerId = setTimeout(() => {
    currentFrame = (currentFrame + 1) % frames.length;
    renderFrame();
    animate();
  }, frames[currentFrame]!.delay);
}

self.onmessage = async (e: MessageEvent<{ type: string; [k: string]: unknown }>) => {
  const { type } = e.data;

  if (type === "init") {
    canvas = e.data["canvas"] as OffscreenCanvas;
    ctx = canvas.getContext("2d");
  } else if (type === "load") {
    abortController?.abort();
    abortController = new AbortController();
    const { signal } = abortController;

    clearTimer();
    playing = false;
    currentFrame = 0;
    frames = [];

    try {
      const response = await fetch(e.data["url"] as string, { signal });
      const buffer = await response.arrayBuffer();
      frames = decodeFrames(buffer);
    } catch {
      if (signal.aborted) return;
      throw new Error("Failed to fetch GIF");
    }

    if (!canvas || !ctx || frames.length === 0) return;

    // Resize canvas to match GIF dimensions
    canvas.width = frames[0]!.imageData.width;
    canvas.height = frames[0]!.imageData.height;
    ctx = canvas.getContext("2d");
    renderFrame();

    const autoPlay = e.data["autoPlay"] as boolean;
    self.postMessage({ type: "ready", isPlaying: autoPlay });

    if (autoPlay) {
      playing = true;
      animate();
    }
  } else if (type === "play") {
    if (!playing) {
      playing = true;
      animate();
    }
  } else if (type === "pause") {
    playing = false;
    clearTimer();
  }
};
