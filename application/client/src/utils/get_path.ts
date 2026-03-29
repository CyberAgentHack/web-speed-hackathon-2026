export const RESPONSIVE_IMAGE_WIDTHS = [320, 640] as const;
export const RESPONSIVE_PROFILE_IMAGE_WIDTHS = [64, 128] as const;

export function getImagePath(
  imageId: string,
  options?: { format?: "jpg" | "webp"; width?: (typeof RESPONSIVE_IMAGE_WIDTHS)[number] },
): string {
  const extension = options?.format ?? "jpg";
  const suffix = options?.width === undefined ? "" : `-${options.width}`;
  return `/images/${imageId}${suffix}.${extension}`;
}

export function getImageSrcSet(imageId: string, format: "jpg" | "webp"): string {
  return RESPONSIVE_IMAGE_WIDTHS.map((width) => `${getImagePath(imageId, { format, width })} ${width}w`)
    .join(", ");
}

export function getMoviePath(movieId: string, extension = "gif"): string {
  return `/movies/${movieId}.${extension}`;
}

export function getMoviePosterPath(movieId: string): string {
  return `/movies/${movieId}.jpg`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(
  profileImageId: string,
  options?: { format?: "jpg" | "webp"; width?: (typeof RESPONSIVE_PROFILE_IMAGE_WIDTHS)[number] },
): string {
  const extension = options?.format ?? "jpg";
  const suffix = options?.width === undefined ? "" : `-${options.width}`;
  return `/images/profiles/${profileImageId}${suffix}.${extension}`;
}

export function getProfileImageSrcSet(profileImageId: string, format: "jpg" | "webp"): string {
  return RESPONSIVE_PROFILE_IMAGE_WIDTHS.map((width) =>
    `${getProfileImagePath(profileImageId, { format, width })} ${width}w`,
  ).join(", ");
}
