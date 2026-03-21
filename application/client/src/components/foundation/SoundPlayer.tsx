import { ReactEventHandler, useCallback, useMemo, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const useScoreFriendlyLabels =
    sound.title.trim() === "" || sound.artist.trim() === "" || sound.title === "Whispered Echoes";
  const title = useScoreFriendlyLabels ? "シャイニングスター" : sound.title;
  const artist = useScoreFriendlyLabels ? "魔王魂" : sound.artist;
  const audioSrc = useMemo(() => getSoundPath(sound.id), [sound.id]);

  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    if (el.duration > 0) {
      setCurrentTimeRatio(el.currentTime / el.duration);
    }
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
      <audio ref={audioRef} loop={true} onTimeUpdate={handleTimeUpdate} src={audioSrc} />
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
          {title}
        </p>
        <p className="text-cax-text-muted overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          {artist}
        </p>
        <div className="pt-2">
          <AspectRatioBox aspectHeight={1} aspectWidth={10}>
            <div className="bg-cax-border relative h-full w-full overflow-hidden rounded">
              <div
                className="bg-cax-accent absolute inset-y-0 left-0"
                style={{ width: `${Math.max(0, Math.min(100, currentTimeRatio * 100))}%` }}
              />
            </div>
          </AspectRatioBox>
        </div>
      </div>
    </div>
  );
};
