/** Compress video: re-encode first 5s as WebM 480p 15fps, center-cropped square. */
export async function compressVideo(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Failed to load video"));
  });

  const srcSize = Math.min(video.videoWidth, video.videoHeight);
  const outSize = Math.min(srcSize, 480);
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d")!;

  const stream = canvas.captureStream(15);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
    ? "video/webm;codecs=vp8"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 500_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<File>((resolve, reject) => {
    recorder.onstop = () => {
      URL.revokeObjectURL(url);
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve(new File([blob], "video.webm", { type: "video/webm" }));
    };
    recorder.onerror = () => reject(new Error("MediaRecorder error"));
    recorder.start(100);

    video.currentTime = 0;
    void video.play();

    const sx = (video.videoWidth - srcSize) / 2;
    const sy = (video.videoHeight - srcSize) / 2;

    const draw = () => {
      if (video.currentTime >= 5 || video.ended || video.paused) {
        recorder.stop();
        video.pause();
        return;
      }
      ctx.drawImage(video, sx, sy, srcSize, srcSize, 0, 0, outSize, outSize);
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);

    // Safety timeout: stop after 10s even if video is longer
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
        video.pause();
      }
    }, 10_000);
  });
}
