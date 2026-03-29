import { useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
  isPriority?: boolean;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handleClick = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        void videoRef.current.play();
        setIsPlaying(true);
        setHasStarted(true);
      }
    }
  }, [isPlaying]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <button
        aria-label="動画プレイヤー"
        className="group relative block h-full w-full bg-stone-200 overflow-hidden"
        onClick={handleClick}
        type="button"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={src}
          // LCPと通信最適化のため、動画本体のプリロードは行わない
          preload="none"
          loop
          muted
          playsInline
          // サムネイルが取得できない場合のフォールバックは背景色とアイコンで行う
          // poster={...} 
        />
        
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-cax-overlay/10">
            <div className="flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full transition-transform group-hover:scale-110">
              <FontAwesomeIcon iconType={hasStarted ? "pause" : "play"} styleType="solid" />
            </div>
          </div>
        )}

        {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full">
                    <FontAwesomeIcon iconType="pause" styleType="solid" />
                </div>
            </div>
        )}
      </button>
    </AspectRatioBox>
  );
};
