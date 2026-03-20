import { type ReactEventHandler, useCallback, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const { data } = useFetch(getSoundPath(sound.id), fetchBinary);

  const barRef = useRef<HTMLDivElement>(null);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>(
    (ev) => {
      const el = ev.currentTarget;
      barRef.current?.style.setProperty(
        "left",
        `${(el.currentTime / el.duration) * 100}%`,
      );
    },
    [],
  );

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
      <audio
        ref={audioRef}
        loop={true}
        onTimeUpdate={handleTimeUpdate}
        src={getSoundPath(sound.id)}
      />
      <div className="p-2">
        <button
          className="bg-cax-accent text-cax-surface-raised flex h-8 w-8 items-center justify-center rounded-full text-sm hover:opacity-75"
          onClick={handleTogglePlaying}
          type="button"
        >
          <FontAwesomeIcon
            iconType={isPlaying ? "pause" : "play"}
            styleType="solid"
          />
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
          <div className="relative h-full w-full aspect-[10/1]">
            <div className="absolute inset-0 h-full w-full">
              {data != null && <SoundWaveSVG soundData={data} />}
            </div>
            <div
              ref={barRef}
              className="bg-cax-surface-subtle absolute inset-0 h-full w-full opacity-75"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
