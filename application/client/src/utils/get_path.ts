export function getImagePath(imageId: string): string {
  return `/images/${imageId}.jpg`;
}

export function getOptimizedImagePath(imageId: string, width: number): string {
  return `/api/v1/optimized-image/${imageId}?w=${width}&format=webp`;
}

export function getOptimizedImageSrcSet(imageId: string, widths: number[]): string {
  return widths
    .map((w) => `/api/v1/optimized-image/${imageId}?w=${w}&format=webp ${w}w`)
    .join(", ");
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

export function getOptimizedProfileImagePath(profileImageId: string, width: number): string {
  return `/api/v1/optimized-image/profiles/${profileImageId}?w=${width}&format=webp`;
}
