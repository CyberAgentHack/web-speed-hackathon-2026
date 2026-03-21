import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 * アニメーションWebPをcanvasに描画して表示します。
 */
export const PausableMovie = ({ src }: Props) => {
  const thumbSrc = src.replace(".webp", "_thumb.jpg");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ playing: true, animId: 0 });
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // canvas にアニメーションWebPを描画する
  useEffect(() => {
    if (!isNearViewport) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    const state = stateRef.current;

    const draw = () => {
      if (!state.playing) return;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      state.animId = requestAnimationFrame(draw);
    };

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      if (state.playing) {
        state.animId = requestAnimationFrame(draw);
      } else {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = src;

    return () => {
      cancelAnimationFrame(state.animId);
      img.src = "";
    };
  }, [isNearViewport, src]);

  const handleClick = useCallback(() => {
    const state = stateRef.current;
    state.playing = !state.playing;
    if (!state.playing) {
      cancelAnimationFrame(state.animId);
    }
    setIsPlaying((p) => !p);
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div ref={containerRef} className="relative h-full w-full">
        {/* Thumbnail before lazy load triggers */}
        {!isNearViewport && (
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            src={thumbSrc}
          />
        )}
        {isNearViewport && (
          <button
            aria-label="動画プレイヤー"
            className="group absolute inset-0 block h-full w-full"
            onClick={handleClick}
            type="button"
          >
            <canvas
              ref={canvasRef}
              className="h-full w-full object-cover"
            />
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
        )}
      </div>
    </AspectRatioBox>
  );
};
