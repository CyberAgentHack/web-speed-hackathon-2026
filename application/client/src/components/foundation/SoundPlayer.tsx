import { ReactEventHandler, useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const soundUrl = getSoundPath(sound.id);

  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    setCurrentTimeRatio(el.currentTime / el.duration);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const handleTogglePlaying = useCallback(() => {
    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      return !isPlaying;
    });
  }, []);

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      <audio ref={audioRef} loop={true} onTimeUpdate={handleTimeUpdate} preload="none" src={soundUrl} />
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
                <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
                  {Array.from({ length: 100 }, (_, i) => {
                    const ratio = 0.3 + 0.7 * Math.abs(Math.sin((i * 7 + sound.id.charCodeAt(0)) * 0.1));
                    return (
                      <rect
                        key={i}
                        fill="var(--color-cax-accent)"
                        height={ratio}
                        width="1"
                        x={i}
                        y={1 - ratio}
                      />
                    );
                  })}
                </svg>
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
