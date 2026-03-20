import classNames from "classnames";
import { Animator, Decoder } from "gifler";
import { GifReader } from "omggif";
import { RefCallback, useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const { data, error, isLoading } = useFetch(src, fetchBinary);
  const isReady = !isLoading && error === null && data !== null;

  const animatorRef = useRef<Animator>(null);
  const canvasCallbackRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (el) => {
      animatorRef.current?.stop();

      if (el === null || data === null) {
        return;
      }

      // GIF を解析する
      const reader = new GifReader(new Uint8Array(data));
      const frames = Decoder.decodeFramesSync(reader);
      const animator = new Animator(reader, frames);

      animator.animateInCanvas(el);
      animator.onFrame(frames[0]!);

      // 視覚効果 off のとき GIF を自動再生しない
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

  const [isPlaying, setIsPlaying] = useState(true);
  const handleClick = useCallback(() => {
    if (!isReady) {
      return;
    }

    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        animatorRef.current?.stop();
      } else {
        animatorRef.current?.start();
      }
      return !isPlaying;
    });
  }, [isReady]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-busy={isLoading}
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full disabled:cursor-default"
        disabled={!isReady}
        onClick={handleClick}
        type="button"
      >
        {isReady ? (
          <>
            <canvas ref={canvasCallbackRef} className="h-full w-full" />
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
          </>
        ) : (
          <div
            className={classNames(
              "flex h-full w-full items-center justify-center bg-cax-surface-subtle text-cax-text-muted",
              {
                "animate-pulse": isLoading,
              },
            )}
          >
            <span className="rounded-full bg-cax-surface-raised/80 px-3 py-1 text-xs font-bold tracking-[0.2em]">
              Loading...
            </span>
          </div>
        )}
      </button>
    </AspectRatioBox>
  );
};
