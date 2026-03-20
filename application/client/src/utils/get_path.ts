export function getImagePath(imageId: string): string {
  return `/images/${imageId}.webp`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.m4a`;
}

export function getSoundWaveformPath(soundId: string): string {
  return `/sounds/${soundId}.json`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.webp`;
}
