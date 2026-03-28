export type ImageVariant = "thumb" | "medium" | "original";

export function getImagePath(
  imageId: string,
  variant: ImageVariant = "original",
): string {
  if (variant === "thumb") {
    return `/images/${imageId}_thumb.jpg`;
  }

  if (variant === "medium") {
    return `/images/${imageId}_medium.jpg`;
  }

  return `/images/${imageId}.jpg`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(
  profileImageId: string,
  variant: ImageVariant = "thumb",
): string {
  if (variant === "thumb") {
    return `/images/profiles/${profileImageId}_thumb.jpg`;
  }

  if (variant === "medium") {
    return `/images/profiles/${profileImageId}_medium.jpg`;
  }

  return `/images/profiles/${profileImageId}.jpg`;
}