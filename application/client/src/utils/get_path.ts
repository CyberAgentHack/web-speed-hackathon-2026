export function getImagePath(imageId: string): string {
  return `/images/${imageId}.jpg`;
}

export function getMoviePath(movieId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `https://res.cloudinary.com/dbxv9wm0r/video/fetch/q_auto,f_auto/${origin}/movies/${movieId}.mp4`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.jpg`;
}
