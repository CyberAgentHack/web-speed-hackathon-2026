import { ReactEventHandler, useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { useAfterLcp } from "@web-speed-hackathon-2026/client/src/hooks/use_after_lcp";
import {
  primeSoundWaveform,
  useSoundWaveform,
} from "@web-speed-hackathon-2026/client/src/hooks/use_sound_waveform";
import { getSoundPath, getSoundWaveformPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const src = getSoundPath(sound.id);
  const waveformSrc = getSoundWaveformPath(sound.id);

  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    setCurrentTimeRatio(el.duration > 0 ? el.currentTime / el.duration : 0);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRequestedWaveform, setHasRequestedWaveform] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const { allowNow: loadWaveformNow, canLoad: shouldLoadWaveform } = useAfterLcp();
  const shouldFetchWaveform = hasRequestedWaveform || (shouldLoadWaveform && isNearViewport);
  const waveform = useSoundWaveform(waveformSrc, shouldFetchWaveform);

  useEffect(() => {
    if (isNearViewport) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      return;
    }

    const element = waveformRef.current;
    if (element == null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "300px 0px",
      },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [isNearViewport]);

  const handleTogglePlaying = useCallback(() => {
    setHasRequestedWaveform(true);
    loadWaveformNow();
    primeSoundWaveform(waveformSrc);
    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        void audioRef.current?.play();
      }
      return !isPlaying;
    });
  }, [loadWaveformNow, waveformSrc]);

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      <audio ref={audioRef} loop={true} onTimeUpdate={handleTimeUpdate} preload="none" src={src} />
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
              <div ref={waveformRef} className="absolute inset-0 h-full w-full">
                {waveform.status === "loaded" ? (
                  <SoundWaveSVG max={waveform.max} peaks={waveform.peaks} />
                ) : (
                  <div aria-hidden="true" className="bg-cax-border/30 h-full w-full" />
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
