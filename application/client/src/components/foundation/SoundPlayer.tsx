import { ReactEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useVisibility } from "@web-speed-hackathon-2026/client/src/hooks/use_visibility";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const { isVisible, ref } = useVisibility();
  const [shouldLoad, setShouldLoad] = useState(false);
  useEffect(() => {
    if (isVisible) {
      setShouldLoad(true);
    }
  }, [isVisible]);

  const { data, isLoading } = useFetch(shouldLoad ? getSoundPath(sound.id) : "", fetchBinary);

  const blobUrl = useMemo(() => {
    return data !== null ? URL.createObjectURL(new Blob([data])) : null;
  }, [data]);

  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    setCurrentTimeRatio(el.currentTime / el.duration);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingPlayRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const handleTogglePlaying = useCallback(() => {
    if (blobUrl === null) {
      pendingPlayRef.current = true;
      setShouldLoad(true);
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
  }, [blobUrl]);

  useEffect(() => {
    if (!pendingPlayRef.current || blobUrl === null) {
      return;
    }

    pendingPlayRef.current = false;
    void audioRef.current?.play();
    setIsPlaying(true);
  }, [blobUrl]);

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      {blobUrl !== null ? (
        <audio ref={audioRef} loop={true} onTimeUpdate={handleTimeUpdate} src={blobUrl} />
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
              <div className="absolute inset-0 h-full w-full">
                {data !== null && !isLoading ? (
                  <SoundWaveSVG soundData={data} />
                ) : (
                  <div className="bg-cax-border/30 h-full w-full rounded-sm" />
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
