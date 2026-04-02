import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactEventHandler } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const [shouldLoadSound, setShouldLoadSound] = useState(true);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const { data, isLoading } = useFetch(getSoundPath(sound.id), fetchBinary, {
    enabled: shouldLoadSound,
  });

  const blobUrl = useMemo(() => {
    return data !== null ? URL.createObjectURL(new Blob([data])) : null;
  }, [data]);

  useEffect(() => {
    return () => {
      if (blobUrl !== null) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    setCurrentTimeRatio(el.currentTime / el.duration);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!shouldAutoplay || blobUrl === null) {
      return;
    }

    void audioRef.current?.play();
    setIsPlaying(true);
    setShouldAutoplay(false);
  }, [blobUrl, shouldAutoplay]);

  const handleTogglePlaying = useCallback(() => {
    if (!shouldLoadSound) {
      setShouldLoadSound(true);
      setShouldAutoplay(true);
      return;
    }

    if (isLoading || data === null || blobUrl === null) {
      return;
    }

    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      return !isPlaying;
    });
  }, [blobUrl, data, isLoading, shouldLoadSound]);

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      {blobUrl !== null ? (
        <audio ref={audioRef} loop={true} onTimeUpdate={handleTimeUpdate} src={blobUrl}>
          <track kind="captions" label="captions" srcLang="ja" />
        </audio>
      ) : null}
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
              {data !== null ? (
                <div className="absolute inset-0 h-full w-full">
                  <SoundWaveSVG soundData={data} />
                </div>
              ) : (
                <div className="bg-cax-surface-subtle absolute inset-0 h-full w-full" />
              )}
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
