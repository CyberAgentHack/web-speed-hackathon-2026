export function getImagePath(imageId: string, width?: 300 | 600): string {
  if (width === 300) {
    return `/images/${imageId}-300.webp`;
  }

  return `/images/${imageId}.webp`;
}

export function getMoviePath(movieId: string): string {
  return `/movies/${movieId}.mp4`;
}

export function getSoundPath(soundId: string): string {
  return `/sounds/${soundId}.mp3`;
}

export function getSoundWaveformPath(soundId: string): string {
  return `/sounds-waveforms/${soundId}.svg`;
}

export function getProfileImagePath(profileImageId: string): string {
  return `/images/profiles/${profileImageId}.webp`;
}
