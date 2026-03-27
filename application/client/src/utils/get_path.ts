export function getImagePath(imageId: string, width: number = 640): string {
  return `/images/${imageId}-${width}w.webp`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.webm`;
}

export function getMoviePosterPath(movieId: string): string {
  return `/movies/${movieId}-poster.webp`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string, width: number = 96): string {
  return `/images/profiles/${profileImageId}-${width}w.webp`;
}
