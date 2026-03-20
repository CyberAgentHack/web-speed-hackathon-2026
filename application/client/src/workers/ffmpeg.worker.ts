type ConvertMovieRequest = {
  id: number;
  type: "convert-movie";
  fileBuffer: ArrayBuffer;
  extension: string;
  size?: number;
};

type ExtractSoundMetadataRequest = {
  id: number;
  type: "extract-sound-metadata";
  fileBuffer: ArrayBuffer;
};

type ConvertSoundRequest = {
  id: number;
  type: "convert-sound";
  fileBuffer: ArrayBuffer;
  extension: string;
  artist: string;
  title: string;
};

type FFmpegWorkerRequest = ConvertMovieRequest | ExtractSoundMetadataRequest | ConvertSoundRequest;

type FFmpegWorkerSuccessResponse = {
  id: number;
  type: "success";
  outputBuffer: ArrayBuffer;
};

type FFmpegWorkerErrorResponse = {
  id: number;
  type: "error";
  message: string;
};

const workerSelf = self as unknown as {
  onmessage: (event: MessageEvent<FFmpegWorkerRequest>) => void;
  postMessage: (message: FFmpegWorkerSuccessResponse | FFmpegWorkerErrorResponse, transfer?: Transferable[]) => void;
};

type FFmpegInstance = import("@ffmpeg/ffmpeg").FFmpeg;

let ffmpegPromise: Promise<FFmpegInstance> | undefined;
let queue: Promise<void> = Promise.resolve();

async function getFFmpeg(): Promise<FFmpegInstance> {
  if (ffmpegPromise) {
    return ffmpegPromise;
  }

  ffmpegPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const ffmpeg = new FFmpeg();

    const [coreURL, wasmURL] = await Promise.all([
      import("@ffmpeg/core?binary").then(({ default: binary }) =>
        URL.createObjectURL(new Blob([binary], { type: "text/javascript" })),
      ),
      import("@ffmpeg/core/wasm?binary").then(({ default: binary }) =>
        URL.createObjectURL(new Blob([binary], { type: "application/wasm" })),
      ),
    ]);

    await ffmpeg.load({ coreURL, wasmURL });
    return ffmpeg;
  })();

  return ffmpegPromise;
}

async function readBinaryFile(ffmpeg: FFmpegInstance, path: string): Promise<ArrayBuffer> {
  const output = await ffmpeg.readFile(path);

  if (typeof output === "string") {
    const encoded = new TextEncoder().encode(output);
    const copied = new Uint8Array(encoded.byteLength);
    copied.set(encoded);
    return copied.buffer;
  }

  const copied = new Uint8Array(output.byteLength);
  copied.set(output);
  return copied.buffer;
}

async function convertMovie(request: ConvertMovieRequest): Promise<ArrayBuffer> {
  const ffmpeg = await getFFmpeg();

  const cropOptions = [
    "'min(iw,ih)':'min(iw,ih)'",
    request.size ? `scale=${request.size}:${request.size}` : undefined,
  ]
    .filter(Boolean)
    .join(",");
  const exportFile = `export.${request.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(request.fileBuffer));
  await ffmpeg.exec(["-i", "file", "-t", "5", "-r", "10", "-vf", `crop=${cropOptions}`, "-an", exportFile]);

  return await readBinaryFile(ffmpeg, exportFile);
}

async function extractSoundMetadata(request: ExtractSoundMetadataRequest): Promise<ArrayBuffer> {
  const ffmpeg = await getFFmpeg();

  await ffmpeg.writeFile("file", new Uint8Array(request.fileBuffer));
  await ffmpeg.exec(["-i", "file", "-f", "ffmetadata", "meta.txt"]);

  return await readBinaryFile(ffmpeg, "meta.txt");
}

async function convertSound(request: ConvertSoundRequest): Promise<ArrayBuffer> {
  const ffmpeg = await getFFmpeg();
  const exportFile = `export.${request.extension}`;

  await ffmpeg.writeFile("file", new Uint8Array(request.fileBuffer));
  await ffmpeg.exec([
    "-i",
    "file",
    "-metadata",
    `artist=${request.artist}`,
    "-metadata",
    `title=${request.title}`,
    "-vn",
    exportFile,
  ]);

  return await readBinaryFile(ffmpeg, exportFile);
}

async function handleRequest(request: FFmpegWorkerRequest): Promise<ArrayBuffer> {
  switch (request.type) {
    case "convert-movie":
      return await convertMovie(request);
    case "extract-sound-metadata":
      return await extractSoundMetadata(request);
    case "convert-sound":
      return await convertSound(request);
  }
}

workerSelf.onmessage = (event: MessageEvent<FFmpegWorkerRequest>) => {
  const request = event.data;

  queue = queue.then(async () => {
    try {
      const outputBuffer = await handleRequest(request);
      const response: FFmpegWorkerSuccessResponse = {
        id: request.id,
        type: "success",
        outputBuffer,
      };
      workerSelf.postMessage(response, [outputBuffer]);
    } catch (error) {
      const response: FFmpegWorkerErrorResponse = {
        id: request.id,
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      };
      workerSelf.postMessage(response);
    }
  });
};
