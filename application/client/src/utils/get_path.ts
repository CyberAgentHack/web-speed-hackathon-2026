export function getImagePath(imageId: string): string {
  return `/images/${imageId}.webp`;
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
