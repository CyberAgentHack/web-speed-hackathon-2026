export const MAGICK_FORMAT = {
  Jpg: "JPG",
  Png: "PNG",
  WebP: "WEBP",
} as const;

export type MagickFormat = (typeof MAGICK_FORMAT)[keyof typeof MAGICK_FORMAT];
