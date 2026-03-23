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
    setCurrentTimeRatio(el.currentTime / el.duration);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  // null = 未読み込み, true = 再生中, false = 一時停止中
  const [isPlaying, setIsPlaying] = useState<boolean | null>(null);
  const handleTogglePlaying = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev === null) {
        // 初回クリック: src がセットされ onCanPlay で再生開始
        return true;
      }
      if (prev) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      return !prev;
    });
  }, []);

  const handleCanPlay = useCallback(() => {
    if (isPlaying === true) {
      audioRef.current?.play();
    }
  }, [isPlaying]);

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      {/* preload="none" でページロード時に音声データを取得しない */}
      <audio
        ref={audioRef}
        loop={true}
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={handleCanPlay}
        preload="none"
        src={isPlaying !== null ? getSoundPath(sound.id) : undefined}
      />
      <div className="p-2">
        <button
          className="bg-cax-accent text-cax-surface-raised flex h-8 w-8 items-center justify-center rounded-full text-sm hover:opacity-75"
          onClick={handleTogglePlaying}
          type="button"
        >
          <FontAwesomeIcon iconType={isPlaying === true ? "pause" : "play"} styleType="solid" />
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
              {/* 波形プレースホルダー（再生前は静的な棒グラフを表示） */}
              <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 1">
                {Array.from({ length: 100 }, (_, i) => {
                  const h = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.3));
                  return (
                    <rect
                      key={i}
                      fill="var(--color-cax-accent)"
                      height={h}
                      width="1"
                      x={i}
                      y={1 - h}
                    />
                  );
                })}
              </svg>
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
