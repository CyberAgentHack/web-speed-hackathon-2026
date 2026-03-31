interface AspectRatioDimensions {
  aspectHeight: number;
  aspectWidth: number;
}

const DEFAULT_IMAGE_ASPECT_RATIO: AspectRatioDimensions = {
  aspectHeight: 9,
  aspectWidth: 16,
};

const DEFAULT_MOVIE_ASPECT_RATIO: AspectRatioDimensions = {
  aspectHeight: 1,
  aspectWidth: 1,
};

const MIN_ASPECT_RATIO = 0.8;
const MAX_ASPECT_RATIO = 1.91;
const ASPECT_RATIO_SCALE = 1000;

function toAspectRatioDimensions(
  width: number | null | undefined,
  height: number | null | undefined,
  fallback: AspectRatioDimensions,
): AspectRatioDimensions {
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    Number.isFinite(width) === false ||
    Number.isFinite(height) === false ||
    width <= 0 ||
    height <= 0
  ) {
    return fallback;
  }

  const ratio = Math.min(MAX_ASPECT_RATIO, Math.max(MIN_ASPECT_RATIO, width / height));

  return {
    aspectHeight: ASPECT_RATIO_SCALE,
    aspectWidth: Math.round(ratio * ASPECT_RATIO_SCALE),
  };
}

export function getImageAspectRatio(
  image: Pick<Models.Image, "width" | "height"> | undefined,
): AspectRatioDimensions {
  return toAspectRatioDimensions(image?.width, image?.height, DEFAULT_IMAGE_ASPECT_RATIO);
}

export function getMovieAspectRatio(
  movie: Pick<Models.Movie, "width" | "height"> | null | undefined,
): AspectRatioDimensions {
  return toAspectRatioDimensions(movie?.width, movie?.height, DEFAULT_MOVIE_ASPECT_RATIO);
}
