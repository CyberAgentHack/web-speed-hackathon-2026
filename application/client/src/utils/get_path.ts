export type ImageSize = "s" | "m" | "l";

export function getImagePath(imageId: string, size?: ImageSize): string {
  const q = size != null ? `?q=${size}` : "";
  return `/images/${imageId}.webp${q}`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.webp?q=s`;
}
