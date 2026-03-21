export function getImagePath(imageId: string, width?: number): string {
  if (width) return `/images/optimized/${imageId}-${width}w.webp`;
  return `/images/${imageId}.jpg`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.gif`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string, size?: number): string {
  if (size) return `/images/profiles/optimized/${profileImageId}-${size}.webp`;
  return `/images/profiles/${profileImageId}.jpg`;
}
