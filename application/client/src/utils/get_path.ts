export function getImagePath(imageId: string): string {
  return `/images/${imageId}.avif`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export const getSoundPath = (soundId: string) => {
  return `/sounds/${soundId}.opus`;
};

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.avif`;
}
