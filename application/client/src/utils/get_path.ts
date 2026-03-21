interface ImageOptions {
  w?: number;
  format?: "webp" | "avif" | "jpg";
  q?: number;
}

function buildQueryString(options?: ImageOptions): string {
  if (!options) return "";
  const params = new URLSearchParams();
  if (options.w) params.set("w", String(options.w));
  if (options.format) params.set("format", options.format);
  if (options.q) params.set("q", String(options.q));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function getImagePath(imageId: string, options?: ImageOptions): string {
  return `/images/${imageId}.jpg${buildQueryString(options)}`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.gif`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string, options?: ImageOptions): string {
  return `/images/profiles/${profileImageId}.jpg${buildQueryString(options)}`;
}
