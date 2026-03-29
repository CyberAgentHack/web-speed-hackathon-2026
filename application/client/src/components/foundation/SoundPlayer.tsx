import { ReactEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { fetchBinary } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

interface ParsedData {
  max: number;
  peaks: number[];
}

type IdleCallbackHandle = number | ReturnType<typeof setTimeout>;
type IdleRequestCallback = (deadline: IdleDeadline) => void;

const waveformCache = new Map<string, ParsedData>();
let workerRequestId = 0;
let waveformWorker: Worker | null = null;

function getWaveformWorker(): Worker {
  if (waveformWorker === null) {
    waveformWorker = new Worker(
      new URL("./sound_waveform_worker.ts", import.meta.url),
      { type: "module" },
    );
  }

  return waveformWorker;
}

function requestIdleWork(callback: IdleRequestCallback): IdleCallbackHandle {
  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(callback, { timeout: 1000 });
  }

  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 0,
    });
  }, 200);
}

function cancelIdleWork(handle: IdleCallbackHandle) {
  if (typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(handle as number);
    return;
  }

  clearTimeout(handle as ReturnType<typeof setTimeout>);
}

async function decodeAudioData(soundPath: string): Promise<ParsedData> {
  const audioCtx = new AudioContext();

  try {
    const soundData = await fetchBinary(soundPath);
    const buffer = await audioCtx.decodeAudioData(soundData.slice(0));
    const leftChannel = new Float32Array(buffer.getChannelData(0));
    const rightChannel =
      buffer.numberOfChannels > 1
        ? new Float32Array(buffer.getChannelData(1))
        : new Float32Array(buffer.getChannelData(0));

    const requestId = workerRequestId++;
    const worker = getWaveformWorker();

    const parsedData = await new Promise<ParsedData>((resolve, reject) => {
      const handleMessage = (event: MessageEvent<{ max: number; peaks: number[]; requestId: number }>) => {
        if (event.data.requestId !== requestId) {
          return;
        }

        worker.removeEventListener("message", handleMessage as EventListener);
        worker.removeEventListener("error", handleError);
        resolve({
          max: event.data.max,
          peaks: event.data.peaks,
        });
      };

      const handleError = (error: ErrorEvent) => {
        worker.removeEventListener("message", handleMessage as EventListener);
        worker.removeEventListener("error", handleError);
        reject(error.error ?? new Error(error.message));
      };

      worker.addEventListener("message", handleMessage as EventListener);
      worker.addEventListener("error", handleError);
      worker.postMessage(
        {
          leftChannel: leftChannel.buffer,
          requestId,
          rightChannel: rightChannel.buffer,
        },
        [leftChannel.buffer, rightChannel.buffer],
      );
    });

    return parsedData;
  } finally {
    void audioCtx.close();
  }
}

export const SoundPlayer = ({ sound }: Props) => {
  const soundPath = getSoundPath(sound.id);
  const [parsedData, setParsedData] = useState<ParsedData | null>(() => waveformCache.get(sound.id) ?? null);

  useEffect(() => {
    if (parsedData !== null) {
      return;
    }

    let isCancelled = false;
    const handle = requestIdleWork(() => {
      void decodeAudioData(soundPath)
        .then((nextParsedData) => {
          waveformCache.set(sound.id, nextParsedData);
          if (!isCancelled) {
            setParsedData(nextParsedData);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setParsedData({
              max: 1,
              peaks: Array.from({ length: 100 }, (_, idx) =>
                idx % 7 === 0 ? 0.75 : idx % 5 === 0 ? 0.55 : 0.35,
              ),
            });
          }
        });
    });

    return () => {
      isCancelled = true;
      cancelIdleWork(handle);
    };
  }, [parsedData, sound.id, soundPath]);

  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    setCurrentTimeRatio(el.duration > 0 ? el.currentTime / el.duration : 0);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const handleTogglePlaying = useCallback(() => {
    setIsPlaying((playing) => {
      if (playing) {
        audioRef.current?.pause();
      } else {
        void audioRef.current?.play();
      }
      return !playing;
    });
  }, []);

  const waveform = useMemo(
    () =>
      parsedData ?? {
        max: 1,
        peaks: undefined,
      },
    [parsedData],
  );

  return (
    <div className="bg-cax-surface-subtle flex h-full w-full items-center justify-center">
      <audio
        ref={audioRef}
        loop={true}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={handleTimeUpdate}
        preload="metadata"
        src={soundPath}
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
              <div className="absolute inset-0 h-full w-full">
                <SoundWaveSVG max={waveform.max} peaks={waveform.peaks} />
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
