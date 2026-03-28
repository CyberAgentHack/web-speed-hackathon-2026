import { useCallback, useRef, useState, memo } from "react";
import classNames from "classnames";
import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

export const PausableMovie = memo(({ src }: Props) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleClick = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full overflow-hidden bg-cax-surface-dimmed"
        onClick={handleClick}
        type="button"
      >
        {/* JSでデコードせず、ブラウザ標準のvideo（またはimg）に任せる */}
        <video
          ref={videoRef}
          src={src.replace(".gif", ".mp4")} // mp4版が用意されている場合
          poster={src} // 読み込み中はGIFを表示
          className="h-full w-full object-cover"
          playsInline
          muted
          loop
          autoPlay={!window.matchMedia("(prefers-reduced-motion: reduce)").matches}
          // パフォーマンス設定
          preload="metadata"
        />
        
        {/* もしmp4がなくGIFしかない場合は、単純に <img> を使い、
            再生/停止は CSS の image-rendering や、srcの差し替えで制御するのが最速です */}

        <div
          className={classNames(
            "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2 transition-opacity",
            {
              "opacity-0 group-hover:opacity-100": isPlaying,
              "opacity-100": !isPlaying,
            },
          )}
        >
          <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
        </div>
      </button>
    </AspectRatioBox>
  );
});

PausableMovie.displayName = "PausableMovie";
