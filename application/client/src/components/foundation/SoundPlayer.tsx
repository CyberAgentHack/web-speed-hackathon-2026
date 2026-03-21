import { type Ref, ReactEventHandler, forwardRef, useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

/**
 * Static waveform placeholder that visually approximates the original SoundWaveSVG.
 * Uses a deterministic pattern based on the sound ID to produce a consistent waveform shape.
 */
const StaticWaveform = forwardRef(({ soundId }: { soundId: string }, ref: Ref<SVGSVGElement>) => {
  // Generate a deterministic waveform from the sound ID
  const bars = Array.from({ length: 100 }, (_, i) => {
    // Simple hash-like function from soundId + index
    let hash = 0;
    const str = soundId + String(i);
    for (let j = 0; j < str.length; j++) {
      hash = (hash * 31 + str.charCodeAt(j)) | 0;
    }
    return Math.round((0.1 + 0.9 * (Math.abs(hash % 1000) / 1000)) * 1000) / 1000;
  });

  return (
    <svg ref={ref} className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {/* Using index as key is safe here: bars is a static-length computed array of primitives with no stable ID */}
      {bars.map((ratio, idx) => (
        <rect
          key={idx}
          fill="var(--color-cax-text-muted)"
          height={ratio}
          width="1"
          x={idx}
          y={Math.round((1 - ratio) * 1000) / 1000}
        />
      ))}
    </svg>
  );
});

export const SoundPlayer = ({ sound }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const prevBoundaryRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const soundSrc = getSoundPath(sound.id);

  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    const ratio = el.currentTime / el.duration;
    const boundary = Math.floor(ratio * 100);

    if (boundary === prevBoundaryRef.current) return;

    const svg = svgRef.current;
    if (!svg) return;
    const rects = svg.querySelectorAll("rect");

    const oldBoundary = prevBoundaryRef.current;
    const accentColor = "var(--color-cax-accent)";
    const mutedColor = "var(--color-cax-text-muted)";

    if (boundary > oldBoundary) {
      for (let i = oldBoundary; i < boundary; i++) {
        rects[i]?.setAttribute("fill", accentColor);
      }
    } else {
      for (let i = boundary; i < oldBoundary; i++) {
        rects[i]?.setAttribute("fill", mutedColor);
      }
    }

    prevBoundaryRef.current = boundary;
  }, []);

  const handleTogglePlaying = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) {
        audioRef.current?.pause();
      } else {
        void audioRef.current?.play();
      }
      return !prev;
    });
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    const svg = svgRef.current;
    if (svg) {
      svg.querySelectorAll("rect").forEach((rect) => {
        rect.setAttribute("fill", "var(--color-cax-text-muted)");
      });
    }
    prevBoundaryRef.current = 0;
  }, []);

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      <audio
        ref={audioRef}
        loop={true}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        preload="none"
        src={soundSrc}
      />
      <div className="p-2">
        <button
          className="bg-cax-accent text-cax-surface-raised flex h-8 w-8 items-center justify-center rounded-full text-sm hover:opacity-75"
          onClick={handleTogglePlaying}
          type="button"
        >
          <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
        </button>
      </div>
      <div className="flex h-full min-w-0 shrink grow flex-col pt-2">
        <p className="overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap">
          {sound.title}
        </p>
        <p className="text-cax-text-muted overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          {sound.artist}
        </p>
        <div className="pt-2">
          <AspectRatioBox aspectHeight={1} aspectWidth={10}>
            <StaticWaveform ref={svgRef} soundId={sound.id} />
          </AspectRatioBox>
        </div>
      </div>
    </div>
  );
};
