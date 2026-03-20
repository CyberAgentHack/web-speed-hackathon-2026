export function getImagePath(imageId: string): string {
  return `/images/${imageId}.jpg`;
}

export function getMoviePath(movieId: string, extension = "gif"): string {
  return `/movies/${movieId}.${extension}`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.jpg`;
}
