import classNames from "classnames";
import { Animator, Decoder } from "gifler";
import { GifReader } from "omggif";
import { RefCallback, useCallback, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInViewport } from "@web-speed-hackathon-2026/client/src/hooks/use_in_viewport";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 * ビューポート付近に入るまでフェッチ・デコードを遅延します。
 */
export const PausableMovie = ({ src }: Props) => {
  const [containerRef, isInViewport] = useInViewport("200px");
  const { data } = useFetch(isInViewport ? src : null, fetchBinary);

  const animatorRef = useRef<Animator>(null);
  const decodedDataRef = useRef<ArrayBuffer | null>(null);
  const canvasCallbackRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (el) => {
      animatorRef.current?.stop();

      if (el === null || data === null) {
        return;
      }

      // 同じデータを二重デコードしない
      if (decodedDataRef.current === data) {
        // canvas 要素が変わっただけなら既存 animator を再接続
        if (animatorRef.current) {
          animatorRef.current.animateInCanvas(el);
          animatorRef.current.start();
        }
        return;
      }

      // メインスレッドを解放してから GIF を解析する
      decodedDataRef.current = data;

      setTimeout(() => {
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
      }, 0);
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
    <div ref={containerRef} className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
      {data !== null ? (
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
    </div>
  );
};
