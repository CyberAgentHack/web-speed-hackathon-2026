import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 * video要素を使って MP4 を再生し、canvas に描画します。
 */
export const PausableMovie = ({ src }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawFrame = () => {
      if (video.paused || video.ended) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || canvas.offsetWidth;
        canvas.height = video.videoHeight || canvas.offsetHeight;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      rafRef.current = requestAnimationFrame(drawFrame);
    };

    const handlePlay = () => {
      cancelAnimationFrame(rafRef.current);
      drawFrame();
    };

    const handleLoadedMetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    // すでに再生中、またはデータが読み込み済みの場合は初期化する
    if (!video.paused) {
      handlePlay();
    }
    if (video.readyState >= 2) {
      handleLoadedMetadata();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [src]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.error);
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  return (
    <button
      className="group relative block h-full w-full overflow-hidden"
      onClick={togglePlay}
      type="button"
    >
      {/* Hidden but active video element for MP4 playback */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 -z-50 opacity-0 pointer-events-none h-full w-full object-cover"
        ref={videoRef}
        src={src}
      />
      {/* Canvas displays the video frames */}
      <canvas
        ref={canvasRef}
        className="h-full w-full object-cover"
      />
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="text-4xl text-white drop-shadow-md">▶</span>
        </div>
      )}
    </button>
  );
};
