import { ReactEventHandler, useCallback, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleLoadedMetadata = useCallback<ReactEventHandler<HTMLAudioElement>>(() => {
    setIsReady(true);
  }, []);

  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    if (!Number.isFinite(el.duration) || el.duration <= 0) {
      setCurrentTimeRatio(0);
      return;
    }
    setCurrentTimeRatio(Math.min(el.currentTime / el.duration, 1));
  }, []);

  const handleTogglePlaying = useCallback(() => {
    const audio = audioRef.current;
    if (audio == null) {
      return;
    }

    if (audio.paused) {
      void audio.play().then(() => {
        setIsPlaying(true);
      });
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback<ReactEventHandler<HTMLAudioElement>>(() => {
    setIsPlaying(false);
    setCurrentTimeRatio(0);
  }, []);

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      <audio
        ref={audioRef}
        src={getSoundPath(sound.id)}
        preload="none"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <div className="p-2">
        <button
          aria-label="音声を再生"
          className="bg-cax-accent text-cax-surface-raised flex h-8 w-8 items-center justify-center rounded-full text-sm hover:opacity-75"
          onClick={handleTogglePlaying}
          type="button"
        >
          <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
        </button>
      </div>
      <div className="flex h-full min-w-0 grow flex-col justify-center py-2 pr-2">
        <p className="overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap">
          {sound.title}
        </p>
        <p className="text-cax-text-muted overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          {sound.artist}
        </p>
        <div className="pt-2">
          <div className="bg-cax-border/60 h-1 w-full overflow-hidden rounded-full">
            <div
              className="bg-cax-accent h-full rounded-full transition-[width]"
              style={{ width: `${currentTimeRatio * 100}%` }}
            />
          </div>
          {!isReady ? (
            <p className="text-cax-text-muted pt-1 text-xs">再生時に音声を読み込みます</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
