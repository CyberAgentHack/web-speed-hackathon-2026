import { useEffect, useState } from "react";

import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export interface SoundWaveformData {
  max: number;
  peaks: number[];
}

type SoundWaveformLoadStatus = "idle" | "loading" | "loaded" | "error";

export interface SoundWaveformState extends SoundWaveformData {
  status: SoundWaveformLoadStatus;
}

interface CacheEntry {
  listeners: Set<() => void>;
  promise: Promise<SoundWaveformData> | null;
  state: SoundWaveformState;
}

function createIdleState(): SoundWaveformState {
  return {
    max: 0,
    peaks: [],
    status: "idle",
  };
}

const waveformCache = new Map<string, CacheEntry>();

function getOrCreateEntry(waveformSrc: string): CacheEntry {
  let entry = waveformCache.get(waveformSrc);
  if (entry != null) {
    return entry;
  }

  entry = {
    listeners: new Set(),
    promise: null,
    state: createIdleState(),
  };
  waveformCache.set(waveformSrc, entry);
  return entry;
}

function notifyListeners(entry: CacheEntry) {
  for (const listener of entry.listeners) {
    listener();
  }
}

function loadSoundWaveform(waveformSrc: string): Promise<SoundWaveformData> {
  const entry = getOrCreateEntry(waveformSrc);

  if (entry.state.status === "loaded") {
    return Promise.resolve({
      max: entry.state.max,
      peaks: entry.state.peaks,
    });
  }

  if (entry.promise != null) {
    return entry.promise;
  }

  entry.state = {
    max: 0,
    peaks: [],
    status: "loading",
  };
  notifyListeners(entry);

  entry.promise = fetchJSON<SoundWaveformData>(waveformSrc)
    .then((waveform) => {
      entry.state = {
        ...waveform,
        status: "loaded",
      };
      entry.promise = null;
      notifyListeners(entry);
      return waveform;
    })
    .catch((error: unknown) => {
      entry.state = {
        max: 0,
        peaks: [],
        status: "error",
      };
      entry.promise = null;
      notifyListeners(entry);
      throw error;
    });

  return entry.promise;
}

export function primeSoundWaveform(waveformSrc: string) {
  void loadSoundWaveform(waveformSrc).catch(() => {
    // 波形取得の失敗でUI全体は落とさない
  });
}

export function useSoundWaveform(waveformSrc: string, enabled: boolean): SoundWaveformState {
  const [state, setState] = useState<SoundWaveformState>(() => getOrCreateEntry(waveformSrc).state);

  useEffect(() => {
    const entry = getOrCreateEntry(waveformSrc);
    const syncState = () => {
      setState(entry.state);
    };

    entry.listeners.add(syncState);
    syncState();

    if (enabled && entry.state.status !== "loaded" && entry.promise == null) {
      void loadSoundWaveform(waveformSrc).catch(() => {
        // 波形取得の失敗でUI全体は落とさない
      });
    }

    return () => {
      entry.listeners.delete(syncState);
    };
  }, [enabled, waveformSrc]);

  return state;
}
