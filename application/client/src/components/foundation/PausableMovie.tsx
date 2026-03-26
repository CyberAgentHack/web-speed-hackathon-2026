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
  poster?: string; // 初回表示用の静止画
}

export const PausableMovie = ({ src, poster }: Props) => {
  const { data, isLoading } = useFetch(src, fetchBinary);
  const animatorRef = useRef<Animator>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false); // GIF デコード完了フラグ

  // canvas callback
  const canvasCallbackRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (el) => {
      if (!el || !data) return;

      // 既存 animator があれば停止
      animatorRef.current?.stop();

      const initGif = () => {
        try {
          const reader = new GifReader(new Uint8Array(data));
          const frames = Decoder.decodeFramesSync(reader);
          const animator = new Animator(reader, frames);
          animator.animateInCanvas(el);
          animator.onFrame(frames[0]!);

          // ユーザーが視覚効果オフなら停止
          const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (!prefersReducedMotion) {
            animator.start();
            setIsPlaying(true);
          }

          animatorRef.current = animator;
          setReady(true);
        } catch (e) {
          console.error("GIF 初期化エラー", e);
        }
      };

      // メインスレッド負荷を避ける
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(initGif);
      } else {
        setTimeout(initGif, 0);
      }
    },
    [data]
  );

  const handleClick = useCallback(() => {
    setIsPlaying((playing) => {
      if (animatorRef.current) {
        playing ? animatorRef.current.stop() : animatorRef.current.start();
      }
      return !playing;
    });
  }, []);

  // 初期表示は poster か透明 canvas
  if (isLoading || !data) {
    return (
      <AspectRatioBox aspectHeight={1} aspectWidth={1}>
        {poster ? <img src={poster} alt="動画サムネイル" className="w-full h-full object-cover" /> : <canvas className="w-full h-full" />}
      </AspectRatioBox>
    );
  }

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full"
        type="button"
        onClick={handleClick}
      >
        <canvas ref={canvasCallbackRef} className="w-full h-full" />
        {ready && (
          <div
            className={classNames(
              "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
              { "opacity-0 group-hover:opacity-100": isPlaying }
            )}
          >
            <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
          </div>
        )}
      </button>
    </AspectRatioBox>
  );
};