import { ReactEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const { data, isLoading } = useFetch(getSoundPath(sound.id), fetchBinary);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (data == null) {
      setBlobUrl(null);
      return;
    }

    const url = URL.createObjectURL(new Blob([data]));
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [data]);

  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);

  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;

    if (Number.isFinite(el.duration) && el.duration > 0) {
      setCurrentTimeRatio(el.currentTime / el.duration);
      return;
    }

    setCurrentTimeRatio(0);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTogglePlaying = useCallback(() => {
    const audio = audioRef.current;

    if (audio == null) {
      return;
    }

    if (audio.paused) {
      void audio.play();
      return;
    }

    audio.pause();
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const wave = useMemo(() => {
    if (data == null) {
      return null;
    }

    return <SoundWaveSVG soundData={data} />;
  }, [data]);

  if (isLoading || data == null || blobUrl == null) {
    return null;
  }

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      <audio
        ref={audioRef}
        loop={true}
        preload="metadata"
        src={blobUrl}
        onPause={handlePause}
        onPlay={handlePlay}
        onTimeUpdate={handleTimeUpdate}
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
              <div className="absolute inset-0 h-full w-full">{wave}</div>

              <div
                className="bg-cax-surface-subtle absolute inset-y-0 right-0 opacity-75"
                style={{ width: `${(1 - currentTimeRatio) * 100}%` }}
              />
            </div>
          </AspectRatioBox>
        </div>
      </div>
    </div>
  );
};