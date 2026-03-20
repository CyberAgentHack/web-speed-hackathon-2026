export function getImagePath(imageId: string, width?: number): string {
  const base = `/images/${imageId}.avif`;
  return width ? `${base}?w=${width}` : base;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string, width?: number): string {
  const base = `/images/profiles/${profileImageId}.avif`;
  return width ? `${base}?w=${width}` : base;
}
