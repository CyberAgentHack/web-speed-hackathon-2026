import classNames from "classnames";
import { Animator, Decoder } from "gifler";
import { GifReader } from "omggif";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const containerRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const element = containerRef.current;
    if (element == null) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px 0px",
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || data !== null) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    void fetchBinary(src).then(
      (result) => {
        if (!isMounted) {
          return;
        }

        setData(result);
        setIsLoading(false);
      },
      () => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      },
    );

    return () => {
      isMounted = false;
    };
  }, [data, isVisible, src]);

  useEffect(() => {
    animatorRef.current?.stop();
    if (canvasRef.current == null || data == null) {
      animatorRef.current = null;
      return;
    }

    // GIF を解析する
    const reader = new GifReader(new Uint8Array(data));
    const frames = Decoder.decodeFramesSync(reader);
    const animator = new Animator(reader, frames);

    animator.animateInCanvas(canvasRef.current);
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

    return () => {
      animator.stop();
      if (animatorRef.current === animator) {
        animatorRef.current = null;
      }
    };
  }, [data]);

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

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        onClick={handleClick}
        type="button"
        ref={containerRef}
      >
        {data !== null ? (
          <canvas ref={canvasRef} className="w-full" />
        ) : (
          <div className="bg-cax-surface-subtle h-full w-full animate-pulse" />
        )}
        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
            {
              "opacity-0 group-hover:opacity-100": isPlaying && data !== null,
              hidden: data === null || isLoading,
            },
          )}
        >
          <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
        </div>
      </button>
    </AspectRatioBox>
  );
};
