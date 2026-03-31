export function getImagePath(imageId: string): string {
  return `/images/${imageId}.avif`;
}

export function getMoviePath(movieId: string, extension = "mp4"): string {
  return `/movies/${movieId}.${extension}`;
}

export function getSoundPath(soundId: string, extension = "mp3"): string {
  return `/sounds/${soundId}.${extension}`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.avif`;
}
