import { useState, useCallback } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
  thumbnailSrc?: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src, thumbnailSrc }: Props) => {
  const [playing, setPlaying] = useState(false);

  const handleClick = useCallback(() => {
    setPlaying(true);
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <img
        alt=""
        className="h-full w-full object-cover"
        fetchPriority={thumbnailSrc && !playing ? "high" : undefined}
        onClick={thumbnailSrc && !playing ? handleClick : undefined}
        src={playing || !thumbnailSrc ? src : thumbnailSrc}
        style={thumbnailSrc && !playing ? { cursor: "pointer" } : undefined}
      />
    </AspectRatioBox>
  );
};
