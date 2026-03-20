interface ImagePathOptions {
  h?: number;
  w?: number;
}

export function getImagePath(imageId: string, options: ImagePathOptions = {}): string {
  const url = new URL(`/images/${imageId}.jpg`, window.location.origin);
  if (options.w !== undefined) {
    url.searchParams.set("w", String(options.w));
  }
  if (options.h !== undefined) {
    url.searchParams.set("h", String(options.h));
  }
  return `${url.pathname}${url.search}`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string, size: number): string {
  return `/images/profiles/${profileImageId}.jpg?w=${size}&h=${size}`;
}
