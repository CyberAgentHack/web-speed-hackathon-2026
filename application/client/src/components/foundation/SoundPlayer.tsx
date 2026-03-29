import { ReactEventHandler, useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const audioSrc = getSoundPath(sound.id);
  const [isActivated, setIsActivated] = useState(false);
  const [playRequested, setPlayRequested] = useState(false);

  // Waveform data is fetched only after the user starts playback.
  const [waveData, setWaveData] = useState<ArrayBuffer | null>(null);
  useEffect(() => {
    if (!isActivated) {
      return;
    }

    let cancelled = false;
    fetch(audioSrc)
      .then((r) => r.arrayBuffer())
      .then((data) => {
        if (!cancelled) setWaveData(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [audioSrc, isActivated]);

  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    setCurrentTimeRatio(el.currentTime / el.duration);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    if (!isActivated || !playRequested) {
      return;
    }

    let cancelled = false;
    const startPlayback = async () => {
      try {
        await audioRef.current?.play();
        if (!cancelled) {
          setIsPlaying(true);
        }
      } catch {
        if (!cancelled) {
          setIsPlaying(false);
        }
      } finally {
        if (!cancelled) {
          setPlayRequested(false);
        }
      }
    };

    void startPlayback();

    return () => {
      cancelled = true;
    };
  }, [isActivated, playRequested]);

  const handleTogglePlaying = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (!isActivated) {
      setIsActivated(true);
    }
    setPlayRequested(true);
  }, [isActivated, isPlaying]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      <audio
        ref={audioRef}
        loop={true}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        preload="none"
        src={isActivated ? audioSrc : undefined}
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
                {waveData !== null ? (
                  <SoundWaveSVG soundData={waveData} />
                ) : (
                  <svg
                    aria-hidden
                    className="h-full w-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 1"
                  >
                    <rect fill="var(--color-cax-border)" height="0.12" width="100" x="0" y="0.44" />
                  </svg>
                )}
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
