import type {
  comments,
  directMessageConversations,
  directMessages,
  images,
  movies,
  posts,
  postsImagesRelations,
  profileImages,
  sounds,
  users,
} from "./schema";

function toISO(dateStr: string): string {
  return new Date(dateStr).toISOString();
}

type Row<T extends { $inferSelect: unknown }> = T["$inferSelect"];

export function serializeProfileImage(row: Row<typeof profileImages>) {
  return {
    id: row.id,
    alt: row.alt,
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
  };
}

export function serializeUser(
  row: Row<typeof users> & {
    profileImage: Row<typeof profileImages> | null;
  },
) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    description: row.description,
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
    profileImage: row.profileImage ? serializeProfileImage(row.profileImage) : null,
  };
}

export function serializeImage(row: Row<typeof images>) {
  return {
    id: row.id,
    alt: row.alt,
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
  };
}

export function serializeMovie(row: Row<typeof movies>) {
  return {
    id: row.id,
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
  };
}

export function serializeSound(row: Row<typeof sounds>) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
  };
}

export function serializePostDetail(
  row: Row<typeof posts> & {
    user: Row<typeof users> & { profileImage: Row<typeof profileImages> | null };
    postsImages: (Row<typeof postsImagesRelations> & { image: Row<typeof images> | null })[];
    movie: Row<typeof movies> | null;
    sound: Row<typeof sounds> | null;
  },
) {
  return {
    id: row.id,
    text: row.text,
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
    userId: row.userId,
    movieId: row.movieId ?? null,
    soundId: row.soundId ?? null,
    user: serializeUser(row.user),
    images: row.postsImages
      .map((pi) => pi.image)
      .filter((img): img is Row<typeof images> => img != null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(serializeImage),
    movie: row.movie ? serializeMovie(row.movie) : null,
    sound: row.sound ? serializeSound(row.sound) : null,
  };
}

export function serializeComment(
  row: Row<typeof comments> & {
    user: Row<typeof users> & { profileImage: Row<typeof profileImages> | null };
  },
) {
  return {
    id: row.id,
    text: row.text,
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
    user: serializeUser(row.user),
  };
}

export function serializeDirectMessage(
  row: Row<typeof directMessages> & {
    sender: Row<typeof users> & { profileImage: Row<typeof profileImages> | null };
  },
) {
  return {
    id: row.id,
    body: row.body,
    isRead: row.isRead,
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
    senderId: row.senderId,
    conversationId: row.conversationId,
    sender: serializeUser(row.sender),
  };
}

type ConversationWithRelations = Row<typeof directMessageConversations> & {
  initiator: Row<typeof users> & { profileImage: Row<typeof profileImages> | null };
  member: Row<typeof users> & { profileImage: Row<typeof profileImages> | null };
  messages: (Row<typeof directMessages> & {
    sender: Row<typeof users> & { profileImage: Row<typeof profileImages> | null };
  })[];
};

export function serializeConversation(row: ConversationWithRelations) {
  return {
    id: row.id,
    initiatorId: row.initiatorId,
    memberId: row.memberId,
    createdAt: toISO(row.createdAt),
    updatedAt: toISO(row.updatedAt),
    initiator: serializeUser(row.initiator),
    member: serializeUser(row.member),
    messages: row.messages.map(serializeDirectMessage),
  };
}
