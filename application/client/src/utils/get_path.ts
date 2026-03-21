interface ImagePathOptions {
  h?: number;
  format?: "avif" | "webp" | "jpg";
  w?: number;
}

export interface ImageSource {
  sizes?: string;
  srcSet: string;
  type: string;
}

export interface MediaSource {
  src: string;
  type: string;
}

const buildPath = (basePath: string, extension: string, options: { h?: number; w?: number } = {}) => {
  const url = new URL(`${basePath}.${extension}`, window.location.origin);
  if (options.w !== undefined) {
    url.searchParams.set("w", String(options.w));
  }
  if (options.h !== undefined) {
    url.searchParams.set("h", String(options.h));
  }
  return `${url.pathname}${url.search}`;
};

const imageFormats = [
  { ext: "avif", type: "image/avif" },
  { ext: "webp", type: "image/webp" },
  { ext: "jpg", type: "image/jpeg" },
] as const;

export function getImagePath(imageId: string, options: ImagePathOptions = {}): string {
  return buildPath(`/images/${imageId}`, options.format ?? "jpg", options);
}

export function getImageSources(
  imageId: string,
  options: ImagePathOptions = {},
  sizes?: string,
): ImageSource[] {
  const widths = [320, 480, 640, 960];
  return imageFormats.map(({ ext, type }) => ({
    type,
    sizes,
    srcSet: widths
      .map((width) => `${getImagePath(imageId, { ...options, format: ext, w: width })} ${width}w`)
      .join(", "),
  }));
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getMovieSources(movieId: string): MediaSource[] {
  return [
    { src: `/movies/${movieId}.webm`, type: "video/webm" },
    { src: getMoviePath(movieId), type: "video/mp4" },
  ];
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getSoundSources(soundId: string): MediaSource[] {
  return [
    { src: `/sounds/${soundId}.ogg`, type: "audio/ogg" },
    { src: getSoundPath(soundId), type: "audio/mpeg" },
  ];
}

export function getProfileImagePath(profileImageId: string, size: number): string {
  return `/images/profiles/${profileImageId}.jpg?w=${size}&h=${size}`;
}
