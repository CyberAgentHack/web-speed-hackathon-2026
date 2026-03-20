export function getImagePath(imageId: string): string {
  return `/images/${imageId}`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getLegacyMoviePath(movieId: string): string {
  return `/movies/${movieId}.gif`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}`;
}
