import classNames from "classnames";
import { Animator, Decoder } from "gifler";
import { GifReader } from "omggif";
import { RefCallback, useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { useInViewOnce } from "@web-speed-hackathon-2026/client/src/hooks/use_in_view_once";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const [buttonRef, isInView] = useInViewOnce<HTMLButtonElement>();
  const animatorRef = useRef<Animator>(null);
  const [binary, setBinary] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      animatorRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    animatorRef.current?.stop();
    setBinary(null);
    setIsLoading(false);
    setHasError(false);
    setIsPlaying(false);
  }, [src]);

  useEffect(() => {
    if (!isInView || binary !== null || isLoading || hasError) {
      return;
    }

    setIsLoading(true);
    setHasError(false);

    void fetchBinary(src).then(
      (data) => {
        setBinary(data);
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      },
    );
  }, [binary, hasError, isInView, isLoading, src]);

  const canvasCallbackRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (el) => {
      animatorRef.current?.stop();

      if (el === null || binary === null) {
        return;
      }

      // GIF を解析する
      const reader = new GifReader(new Uint8Array(binary));
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
    [binary],
  );

  const handleClick = useCallback(() => {
    if (binary === null) {
      if (hasError && !isLoading) {
        setHasError(false);
      }
      return;
    }

    setIsPlaying((current) => {
      if (current) {
        animatorRef.current?.stop();
      } else {
        animatorRef.current?.start();
      }
      return !current;
    });
  }, [binary, hasError, isLoading]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full overflow-hidden"
        ref={buttonRef}
        onClick={handleClick}
        type="button"
      >
        <div className="bg-cax-surface-subtle absolute inset-0 h-full w-full" />

        {binary !== null ? <canvas ref={canvasCallbackRef} className="relative z-0 w-full" /> : null}

        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cax-overlay/50 text-3xl text-cax-surface-raised",
            binary !== null ? "h-16 w-16" : "h-20 w-20",
            {
              "opacity-0 group-hover:opacity-100": binary !== null && isPlaying,
            },
          )}
        >
          <span className={classNames({ "animate-spin": binary === null && isLoading })}>
            <FontAwesomeIcon
              iconType={
                binary !== null
                  ? isPlaying
                    ? "pause"
                    : "play"
                  : isLoading
                    ? "circle-notch"
                    : hasError
                      ? "exclamation-circle"
                      : "play"
              }
              styleType="solid"
            />
          </span>
        </div>

        {binary === null ? (
          <p className="text-cax-surface-raised absolute right-2 bottom-2 rounded bg-cax-overlay/60 px-2 py-1 text-xs">
            {hasError ? "再試行する" : "動画を準備中..."}
          </p>
        ) : null}
      </button>
    </AspectRatioBox>
  );
};
