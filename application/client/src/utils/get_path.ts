export function getImagePath(imageId: string): string {
  return `/images/${imageId}.avif`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getMovieThumbnailPath(movieId: string): string {
  return `/movies/thumbnails/${movieId}.avif`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.webm`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.avif`;
}
