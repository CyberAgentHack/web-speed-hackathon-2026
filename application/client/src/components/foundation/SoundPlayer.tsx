import { ReactEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
  lazy?: boolean;
}

export const SoundPlayer = ({ sound }: Props) => {
  const soundPath = getSoundPath(sound.id);

  const [soundData, setSoundData] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 波形表示用に即座にデータを取得
  useEffect(() => {
    fetchBinary(soundPath).then((data) => {
      setSoundData(data);
    });
  }, [soundPath]);

  const blobUrl = useMemo(() => {
    return soundData !== null ? URL.createObjectURL(new Blob([soundData])) : null;
  }, [soundData]);

  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    setCurrentTimeRatio(el.currentTime / el.duration);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTogglePlaying = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (soundData !== null) {
      audioRef.current?.play();
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    fetchBinary(soundPath).then((data) => {
      setSoundData(data);
      setIsLoading(false);
      setIsPlaying(true);
    });
  }, [isPlaying, soundData, soundPath]);

  // Auto-play when blobUrl becomes available after fetch
  const handleCanPlay = useCallback(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play();
    }
  }, [isPlaying]);

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      {blobUrl != null && (
        <audio ref={audioRef} loop={true} onCanPlay={handleCanPlay} onTimeUpdate={handleTimeUpdate} src={blobUrl} />
      )}
      <div className="p-2">
        <button
          className="bg-cax-accent text-cax-surface-raised flex h-8 w-8 items-center justify-center rounded-full text-sm hover:opacity-75"
          disabled={isLoading}
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
        {soundData != null && (
          <div className="pt-2">
            <AspectRatioBox aspectHeight={1} aspectWidth={10}>
              <div className="relative h-full w-full">
                <div className="absolute inset-0 h-full w-full">
                  <SoundWaveSVG soundData={soundData} />
                </div>
                <div
                  className="bg-cax-surface-subtle absolute inset-0 h-full w-full opacity-75"
                  style={{ left: `${currentTimeRatio * 100}%` }}
                ></div>
              </div>
            </AspectRatioBox>
          </div>
        )}
      </div>
    </div>
  );
};
