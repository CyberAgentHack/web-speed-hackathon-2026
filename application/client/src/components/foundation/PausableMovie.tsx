import classNames from "classnames";
import { RefObject, useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

function captureCurrentFrame(imageRef: RefObject<HTMLImageElement | null>): string | null {
  const image = imageRef.current;
  if (image == null || image.naturalWidth === 0 || image.naturalHeight === 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (context == null) {
    return null;
  }

  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const readyCanvasRef = useRef<HTMLCanvasElement>(null);
  const handleLoadImage = useCallback(() => {
    const image = imageRef.current;
    const canvas = readyCanvasRef.current;
    if (image == null || canvas == null) {
      return;
    }
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
  }, []);

  const [isPlaying, setIsPlaying] = useState(true);
  const [pausedFrameUrl, setPausedFrameUrl] = useState<string | null>(null);
  const handleClick = useCallback(() => {
    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        setPausedFrameUrl(captureCurrentFrame(imageRef));
      } else {
        setPausedFrameUrl(null);
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
      >
        <canvas
          ref={readyCanvasRef}
          aria-hidden={true}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
        {pausedFrameUrl == null ? (
          <img
            alt=""
            className="h-full w-full object-cover"
            ref={imageRef}
            onLoad={handleLoadImage}
            src={src}
          />
        ) : (
          <img alt="" className="h-full w-full object-cover" src={pausedFrameUrl} />
        )}
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
