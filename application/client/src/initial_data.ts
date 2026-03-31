declare global {
  interface Window {
    __INITIAL_DATA__?: Record<string, unknown>;
  }
}

export function consumeInitialData<T>(key: string): T | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const data = window.__INITIAL_DATA__?.[key];

  if (window.__INITIAL_DATA__ !== undefined) {
    delete window.__INITIAL_DATA__[key];
  }

  return data as T | undefined;
}

export {};
