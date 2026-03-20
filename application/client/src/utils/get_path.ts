export function getImagePath(imageId: string): string {
  return `/images/${imageId}.jpg`;
}

export function getImageThumbnailPath(imageId: string): string {
  return `/images/thumbnails/${imageId}.jpg`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.jpg`;
}

export function getProfileImageThumbnailPath(profileImageId: string): string {
  return `/images/profiles/thumbnails/${profileImageId}.jpg`;
}
