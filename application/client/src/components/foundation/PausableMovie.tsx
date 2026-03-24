import classNames from "classnames";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 画面内に入ったときのみ GIF を取得・デコードする
  useEffect(() => {
    const el = containerRef.current;
    if (el == null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { data, isLoading } = useFetch(isVisible ? src : null, fetchBinary);

  // Animator 型は gifler の型だが、動的 import するため any で保持
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animatorRef = useRef<any>(null);
  const canvasCallbackRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (el) => {
      animatorRef.current?.stop();

      if (el === null || data === null) {
        return;
      }

      // gifler / omggif を動的 import してデコード
      void Promise.all([import("gifler"), import("omggif")]).then(
        ([{ Animator, Decoder }, { GifReader }]) => {
          const reader = new GifReader(new Uint8Array(data));
          const frames = Decoder.decodeFramesSync(reader);
          const animator = new Animator(reader, frames);

          animator.animateInCanvas(el);
          animator.onFrame(frames[0]!);

          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setIsPlaying(false);
            animator.stop();
          } else {
            setIsPlaying(true);
            animator.start();
          }

          animatorRef.current = animator;
        },
      );
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

  return (
    <div ref={containerRef}>
      <AspectRatioBox aspectHeight={1} aspectWidth={1}>
        {!isLoading && data !== null ? (
          <button
            aria-label="動画プレイヤー"
            className="group relative block h-full w-full"
            onClick={handleClick}
            type="button"
          >
            <canvas ref={canvasCallbackRef} className="w-full" />
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
        ) : null}
      </AspectRatioBox>
    </div>
  );
};
