import classNames from "classnames";
import { Animator, Decoder } from "gifler";
import { GifReader } from "omggif";
import { RefCallback, useCallback, useEffect, useRef, useState } from "react";

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
  const [shouldLoadMovie, setShouldLoadMovie] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useFetch(src, fetchBinary, { enabled: shouldLoadMovie });

  useEffect(() => {
    if (shouldLoadMovie) {
      return;
    }

    const target = rootRef.current;
    if (target === null) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        setShouldLoadMovie(true);
        observer.disconnect();
      },
      { rootMargin: "256px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldLoadMovie]);

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
    if (isLoading || data === null) {
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
  }, [data, isLoading]);

  return (
    <div className="h-full w-full" ref={rootRef}>
      <AspectRatioBox aspectHeight={1} aspectWidth={1}>
        <button
          aria-label="動画プレイヤー"
          className="group relative block h-full w-full"
          onClick={handleClick}
          type="button"
        >
          {!isLoading && data !== null ? (
            <canvas ref={canvasCallbackRef} className="w-full" />
          ) : (
            <div className="bg-cax-surface-subtle h-full w-full" />
          )}
          <div
            className={classNames(
              "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
              {
                "opacity-0 group-hover:opacity-100": data !== null && isPlaying,
              },
            )}
          >
            <FontAwesomeIcon
              iconType={data !== null && isPlaying ? "pause" : "play"}
              styleType="solid"
            />
          </div>
        </button>
      </AspectRatioBox>
    </div>
  );
};
