import { ReactEventHandler, useCallback, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    // duration が 0 の場合は計算不能なので無視
    if (!Number.isFinite(el.duration) || el.duration <= 0) return;
    setCurrentTimeRatio(el.currentTime / el.duration);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const handleTogglePlaying = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) {
        audioRef.current?.pause();
      } else {
        void audioRef.current?.play();
      }
      return !prev;
    });
  }, []);

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      <audio
        ref={audioRef}
        loop={true}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        src={getSoundPath(sound.id)}
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
              {/* 解析ロード無しのプレースホルダ（LCP を確実に出すため） */}
              <div className="absolute inset-0 flex items-end justify-between gap-0.5 px-1 opacity-60">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="w-0.5 bg-cax-accent"
                    style={{ height: `${((i % 5) + 1) * 18}%` }}
                  />
                ))}
              </div>
              {/* 再生位置の指標 */}
              <div
                className="absolute inset-y-0 w-0.5 bg-cax-brand-soft opacity-80"
                style={{ left: `${Math.max(0, Math.min(100, currentTimeRatio * 100))}%` }}
              />
            </div>
          </AspectRatioBox>
        </div>
      </div>
    </div>
  );
};
