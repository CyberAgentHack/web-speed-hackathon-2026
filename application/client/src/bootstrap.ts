export interface AppBootstrapData {
  initialTimelinePosts?: Models.Post[];
}

declare global {
  interface Window {
    __CAX_BOOTSTRAP__?: AppBootstrapData;
  }
}

export function readBootstrapData(): AppBootstrapData | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.__CAX_BOOTSTRAP__ ?? null;
}
