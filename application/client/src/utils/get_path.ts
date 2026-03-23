export function getImagePath(imageId: string, width?: number): string {
  const base = `/images/${imageId}.jpg`;
  return width ? `${base}?width=${width}` : base;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.gif`;
}

export function getMovieThumbnailPath(movieId: string): string {
  return `/movies/${movieId}.gif?thumb=1`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string, width?: number): string {
  const base = `/images/profiles/${profileImageId}.jpg`;
  return width ? `${base}?width=${width}` : base;
}
