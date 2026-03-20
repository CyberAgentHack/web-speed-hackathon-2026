import classNames from "classnames";
import { Animator, Decoder } from "gifler";
import { GifReader } from "omggif";
import { RefCallback, useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const animatorRef = useRef<Animator>(null);
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null);
  const [data, setData] = useState<ArrayBuffer | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const buttonRef = useCallback<RefCallback<HTMLButtonElement>>((element) => {
    setButtonElement(element);
  }, []);

  useEffect(() => {
    if (isActivated) {
      return;
    }

    if (buttonElement === null) {
      return;
    }

    // Synchronize activation with the viewport intersection observer.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsActivated(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(buttonElement);

    return () => {
      observer.disconnect();
    };
  }, [buttonElement, isActivated]);

  useEffect(() => {
    if (!isActivated) {
      return;
    }

    let cancelled = false;

    // Synchronize the loaded GIF binary with the network once the movie is near the viewport.
    void fetchBinary(src).then(
      (nextData) => {
        if (!cancelled) {
          setData(nextData);
        }
      },
      () => {
        if (!cancelled) {
          setData(null);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [isActivated, src]);

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
    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        animatorRef.current?.stop();
      } else {
        animatorRef.current?.start();
      }
      return !isPlaying;
    });
  }, []);

  const isReady = data !== null;

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        ref={buttonRef}
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
      >
        {isReady ? (
          <canvas ref={canvasCallbackRef} className="w-full" />
        ) : (
          <div className="bg-cax-surface-subtle h-full w-full" />
        )}
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
            {
              "opacity-0 group-hover:opacity-100": isPlaying && isReady,
            },
          )}
        >
          <FontAwesomeIcon iconType={isReady && isPlaying ? "pause" : "play"} styleType="solid" />
        </div>
      </button>
    </AspectRatioBox>
  );
};
