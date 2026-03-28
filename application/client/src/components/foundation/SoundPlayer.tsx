import { ReactEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useIntersectionObserver } from "@web-speed-hackathon-2026/client/src/hooks/use_intersection_observer";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

const SoundPlayerInner = ({ sound }: Props) => {
  const soundPath = getSoundPath(sound.id);
  // バイナリを1回だけ取得し、波形表示と audio 再生の両方に使い回す
  const { data } = useFetch(soundPath, fetchBinary);

  // 取得したバイナリから Blob URL を生成して audio 要素に渡す（二重ダウンロード防止）
  const blobUrl = useMemo(() => {
    if (!data) return null;
    return URL.createObjectURL(new Blob([data], { type: "audio/mpeg" }));
  }, [data]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

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
        void audioRef.current?.play();
      }
      return !isPlaying;
    });
  }, []);

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      {blobUrl && <audio ref={audioRef} loop onTimeUpdate={handleTimeUpdate} src={blobUrl} />}
      <div className="p-2">
        <button
          className="bg-cax-accent text-cax-surface-raised flex h-8 w-8 items-center justify-center rounded-full text-sm hover:opacity-75 disabled:opacity-50"
          disabled={!blobUrl}
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
        {data !== null && (
          <div className="pt-2">
            <AspectRatioBox aspectHeight={1} aspectWidth={10}>
              <div className="relative h-full w-full">
                <div className="absolute inset-0 h-full w-full">
                  <SoundWaveSVG soundData={data} />
                </div>
                <div
                  className="bg-cax-surface-subtle absolute inset-0 h-full w-full opacity-75"
                  style={{ transform: `translateX(${currentTimeRatio * 100}%)` }}
                ></div>
              </div>
            </AspectRatioBox>
          </div>
        )}
      </div>
    </div>
  );
};

export const SoundPlayer = ({ sound }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef, { rootMargin: "200px" });

  return (
    <div ref={containerRef} className="h-full w-full">
      {isVisible ? <SoundPlayerInner sound={sound} /> : null}
    </div>
  );
};
