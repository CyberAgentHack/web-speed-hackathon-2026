export const RESPONSIVE_IMAGE_WIDTHS = [320, 640, 960, 1280] as const;
export const RESPONSIVE_PROFILE_IMAGE_WIDTHS = [64, 128, 256, 512] as const;
export const PROFILE_IMAGE_SOURCE_WIDTH = 800;

export function getImagePath(imageId: string): string {
  return `/images/${imageId}.webp`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.gif`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.webp`;
}

export function getResponsiveProfileImagePath(profileImageId: string, width: number): string {
  return `/images/profiles/${profileImageId}-${width}w.webp`;
}
