import { ReactEventHandler, useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useNearViewport } from "@web-speed-hackathon-2026/client/src/hooks/use_near_viewport";

import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import {
  getSoundSources,
  getWaveformPath,
} from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface WaveformData {
  max: number;
  peaks: number[];
}

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const { isNearViewport, targetRef } = useNearViewport<HTMLDivElement>({
    rootMargin: "320px 0px",
  });
  const waveformPath = isNearViewport ? getWaveformPath(sound.id) : null;
  const { data: waveformData, isLoading } = useFetch(waveformPath, fetchJSON<WaveformData>);

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
    <div ref={targetRef} className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      <audio ref={audioRef} loop={true} onTimeUpdate={handleTimeUpdate} preload="none">
        {isNearViewport &&
          getSoundSources(sound.id).map((source) => (
            <source key={source.type} src={source.src} type={source.type} />
          ))}
      </audio>
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
              {isLoading || waveformData === null ? (
                <div className="bg-cax-text-muted/20 absolute inset-0 rounded-sm" />
              ) : (
                <>
                  <div className="absolute inset-0 h-full w-full">
                    <SoundWaveSVG max={waveformData.max} peaks={waveformData.peaks} />
                  </div>
                  <div
                    className="bg-cax-surface-subtle absolute inset-0 h-full w-full opacity-75"
                    style={{ left: `${currentTimeRatio * 100}%` }}
                  ></div>
                </>
              )}
            </div>
          </AspectRatioBox>
        </div>
      </div>
    </div>
  );
};
