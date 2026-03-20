export function getImagePath(imageId: string): string {
  return `/images/${imageId}.webp`;
}

export function getImageSrcSet(imageId: string): string {
  return `/images/${imageId}_w320.webp 320w, /images/${imageId}_w640.webp 640w, /images/${imageId}_w1280.webp 1280w`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getMoviePosterPath(movieId: string): string {
  return `/movies/${movieId}_poster.webp`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.webp`;
}

export function getProfileImageSrcSet(profileImageId: string): string {
  return `/images/profiles/${profileImageId}_w256.webp 256w`;
}
