export function getImagePath(imageId: string): string {
  return `/images/${imageId}.webp`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.webm`;
}

export function getMoviePosterPath(movieId: string): string {
  return `/movies/${movieId}.jpg`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.webp`;
}
