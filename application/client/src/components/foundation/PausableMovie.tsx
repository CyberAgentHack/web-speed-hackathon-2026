import classNames from "classnames";
import { RefCallback, useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const workerRef = useRef<Worker | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // WebWorkerでデコードと描画をする
  const canvasCallbackRef = useCallback<RefCallback<HTMLCanvasElement>>((el) => {
    canvasElRef.current = el;
    if (el === null) {
      workerRef.current?.terminate();
      workerRef.current = null;
      return;
    }
    const worker = new Worker(new URL("../../workers/gif_worker.ts", import.meta.url));
    worker.onmessage = ({ data }: MessageEvent<{ type: string; isPlaying: boolean }>) => {
      if (data.type === "ready") {
        setIsLoading(false);
        setIsPlaying(data.isPlaying);
      }
    };
    workerRef.current = worker;
    const offscreen = el.transferControlToOffscreen();
    worker.postMessage({ type: "init", canvas: offscreen }, [offscreen]);
  }, []);

  // IntersectionObserverで画面に入ったときに動画の読み込みを開始する
  useEffect(() => {
    const el = canvasElRef.current;
    if (!el || !workerRef.current) return;

    const worker = workerRef.current;
    const autoPlay = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        worker.postMessage({ type: "load", url: src, autoPlay });
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  const handleClick = useCallback(() => {
    setIsPlaying((prev) => {
      workerRef.current?.postMessage({ type: prev ? "pause" : "play" });
      return !prev;
    });
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        disabled={isLoading}
        aria-busy={isLoading || undefined}
        type="button"
      >
        <canvas ref={canvasCallbackRef} className="h-full w-full object-cover object-center" />
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
            {
              "opacity-0 group-hover:opacity-100": isPlaying,
            },
          )}
        >
          <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
        </div>
      </button>
    </AspectRatioBox>
  );
};
