import { ReactEventHandler, useCallback, useRef, useState } from "react";

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
const StaticWaveform = ({ soundId }: { soundId: string }) => {
  // Generate a deterministic waveform from the sound ID
  const bars = Array.from({ length: 100 }, (_, i) => {
    // Simple hash-like function from soundId + index
    let hash = 0;
    const str = soundId + String(i);
    for (let j = 0; j < str.length; j++) {
      hash = (hash * 31 + str.charCodeAt(j)) | 0;
    }
    // Normalize to 0.1 - 1.0 range
    const ratio = 0.1 + 0.9 * (Math.abs(hash % 1000) / 1000);
    return ratio;
  });

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
      {/* Using index as key is safe here: bars is a static-length computed array of primitives with no stable ID */}
      {bars.map((ratio, idx) => (
        <rect
          key={idx}
          fill="var(--color-cax-accent)"
          height={ratio}
          width="1"
          x={idx}
          y={1 - ratio}
        />
      ))}
    </svg>
  );
};

export const SoundPlayer = ({ sound }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);

  const soundSrc = getSoundPath(sound.id);

  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    setCurrentTimeRatio(el.currentTime / el.duration);
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
    setCurrentTimeRatio(0);
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
            <div className="relative h-full w-full">
              <div className="absolute inset-0 h-full w-full">
                <StaticWaveform soundId={sound.id} />
              </div>
              <div
                className="bg-cax-surface-subtle absolute inset-0 h-full w-full opacity-75"
                style={{ left: `${currentTimeRatio * 100}%` }}
              ></div>
            </div>
          </AspectRatioBox>
        </div>
      </div>
    </div>
  );
};
