function isSameProfileImage(
  a: Models.ProfileImage | null | undefined,
  b: Models.ProfileImage | null | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  return a.id === b.id && a.alt === b.alt;
}

function isSameUserSummary(a: Models.User, b: Models.User): boolean {
  if (a === b) {
    return true;
  }
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.username === b.username &&
    isSameProfileImage(a.profileImage, b.profileImage)
  );
}

function isSameMovie(
  a: Models.Movie | null | undefined,
  b: Models.Movie | null | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  return a.id === b.id;
}

function isSameSound(
  a: Models.Sound | null | undefined,
  b: Models.Sound | null | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  return a.id === b.id && a.title === b.title && a.artist === b.artist;
}

function isSameImages(
  a: Models.Image[] | null | undefined,
  b: Models.Image[] | null | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a == null || b == null || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const left = a[i]!;
    const right = b[i]!;
    if (left.id !== right.id || left.alt !== right.alt) {
      return false;
    }
  }
  return true;
}

export function isSamePostForRender(a: Models.Post, b: Models.Post): boolean {
  if (a === b) {
    return true;
  }
  return (
    a.id === b.id &&
    a.text === b.text &&
    a.createdAt === b.createdAt &&
    isSameUserSummary(a.user, b.user) &&
    isSameImages(a.images, b.images) &&
    isSameMovie(a.movie, b.movie) &&
    isSameSound(a.sound, b.sound)
  );
}

export function isSameCommentForRender(a: Models.Comment, b: Models.Comment): boolean {
  if (a === b) {
    return true;
  }
  return (
    a.id === b.id &&
    a.text === b.text &&
    a.createdAt === b.createdAt &&
    isSameUserSummary(a.user, b.user)
  );
}
