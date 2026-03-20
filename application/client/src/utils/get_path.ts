export function getImagePath(imageId: string): string {
  return `/images/${imageId}.jpg`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.gif`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getSoundPeaksPath(soundId: string): string {
  return `/sounds/${soundId}.peaks.json`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.jpg`;
}
