import classNames from "classnames";
import { Animator, Decoder } from "gifler";
import { GifReader } from "omggif";
import { RefCallback, useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
  width?: number;
  height?: number;
}

/**
 * クリックすると再生/一時停止を切り替える GIF プレイヤー。
 */
export const PausableMovie = ({ src, width, height }: Props) => {
  const [data, setData] = useState<ArrayBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const animatorRef = useRef<Animator>(null);

  // GIF データを非同期フェッチ
  useEffect(() => {
    (async () => {
      try {
        const binaryData = await fetchBinary(src);
        setData(binaryData);
      } catch {
        // Ignore fetch errors
      }
    })();
  }, [src]);

  const canvasCallbackRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (el) => {
      animatorRef.current?.stop();

      if (el === null || data === null) {
        return;
      }

      const reader = new GifReader(new Uint8Array(data));

      // 最初のフレームだけ先にデコード
      const firstFrame = Decoder.decodeFramesSync(reader, 1);
      const animator = new Animator(reader, firstFrame);

      animator.animateInCanvas(el);
      animator.onFrame(firstFrame[0]!);

      // 残りのフレームを非同期でデコード（requestIdleCallback で優先度を下げる）
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(() => {
          try {
            const allFrames = Decoder.decodeFramesSync(reader);
            // フレームを更新
            animator.frames = allFrames;
          } catch {
            // Ignore decoding errors
          }
        });
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setIsPlaying(false);
        animator.stop();
      } else {
        setIsPlaying(true);
        animator.start();
      }

      animatorRef.current = animator;
    },
    [data],
  );
  const handleClick = useCallback(() => {
    setIsPlaying((currentIsPlaying) => {
      if (currentIsPlaying) {
        animatorRef.current?.stop();
      } else {
        animatorRef.current?.start();
      }

      return !currentIsPlaying;
    });
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        {data === null && (
          <div aria-hidden="true" className="absolute inset-0 h-full w-full animate-pulse bg-cax-surface-subtle" />
        )}
        <canvas ref={canvasCallbackRef} className="h-full w-full" width={width} height={height} />
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cax-overlay/50 text-3xl text-cax-surface-raised",
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
