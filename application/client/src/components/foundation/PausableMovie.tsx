import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

interface AnimatorLike {
  start(): void;
  stop(): void;
  animateInCanvas(el: HTMLCanvasElement): void;
  onFrame(frame: unknown): void;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const [isActivated, setIsActivated] = useState(false);
  const { data, isLoading } = useFetch(isActivated ? src : "", fetchBinary);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const animatorRef = useRef<AnimatorLike>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const handleClick = useCallback(() => {
    if (!isActivated) {
      setIsActivated(true);
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
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    animatorRef.current?.stop();
    animatorRef.current = null;

    if (!isActivated || data === null || canvas === null) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const [{ Animator, Decoder }, { GifReader }] = await Promise.all([
        import("gifler"),
        import("omggif"),
      ]);
      if (cancelled || canvasRef.current === null) {
        return;
      }

      const reader = new GifReader(new Uint8Array(data));
      const frames = Decoder.decodeFramesSync(reader);
      const animator = new Animator(reader, frames) as AnimatorLike;

      animator.animateInCanvas(canvasRef.current);
      animator.onFrame(frames[0]!);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setIsPlaying(false);
        animator.stop();
      } else {
        setIsPlaying(true);
        animator.start();
      }

      animatorRef.current = animator;
    })();

    return () => {
      cancelled = true;
      animatorRef.current?.stop();
      animatorRef.current = null;
    };
  }, [data, isActivated]);

  if (!isActivated || isLoading || data === null) {
    return (
      <AspectRatioBox aspectHeight={1} aspectWidth={1}>
        <button
          aria-label="動画プレイヤー"
          className="bg-cax-surface-subtle text-cax-text-subtle border-cax-border flex h-full w-full items-center justify-center rounded-lg border"
          onClick={handleClick}
          type="button"
        >
          <FontAwesomeIcon iconType="play" styleType="solid" />
        </button>
      </AspectRatioBox>
    );
  }

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        <canvas ref={canvasRef} className="w-full" />
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
