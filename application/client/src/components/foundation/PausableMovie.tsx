import classNames from "classnames";
import { Animator, Decoder } from "gifler";
import { GifReader } from "omggif";
import { RefCallback, useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useIntersectionObserver } from "@web-speed-hackathon-2026/client/src/hooks/use_intersection_observer";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

const PausableMovieInner = ({ src }: Props) => {
  const { data, isLoading } = useFetch(src, fetchBinary);

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
    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        animatorRef.current?.stop();
      } else {
        animatorRef.current?.start();
      }
      return !isPlaying;
    });
  }, []);

  // バイナリ取得中は img でプレースホルダー表示（LCP に貢献させる）
  if (isLoading) {
    return (
      <AspectRatioBox aspectHeight={1} aspectWidth={1}>
        <img alt="" className="h-full w-full object-cover" src={src} />
      </AspectRatioBox>
    );
  }

  if (data === null) {
    return null;
  }

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
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
    </AspectRatioBox>
  );
};

/**
 * ビューポートに近づいたタイミングで GIF バイナリの取得・描画を開始します。
 */
export const PausableMovie = ({ src }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef, { rootMargin: "200px" });

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div ref={containerRef} className="h-full w-full">
        {isVisible ? (
          <PausableMovieInner src={src} />
        ) : (
          <img alt="" className="h-full w-full object-cover" src={src} />
        )}
      </div>
    </AspectRatioBox>
  );
};
