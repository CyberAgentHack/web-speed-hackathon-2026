export const DEFAULT_PROFILE_IMAGE_ID = "396fe4ce-aa36-4d96-b54e-6db40bae2eed";

export function getImagePath(imageId: string): string {
  return `/images/optimized/${imageId}.jpg`;
}

export function getOriginalImagePath(imageId: string): string {
  return `/images/${imageId}.jpg`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.gif`;
}

export function getMoviePosterPath(movieId: string): string {
  return `/movies/posters/${movieId}.jpg`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.jpg`;
}

export function getSafeProfileImagePath(profileImage?: Models.ProfileImage | null): string {
  return getProfileImagePath(profileImage?.id ?? DEFAULT_PROFILE_IMAGE_ID);
}
