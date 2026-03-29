export type ProfileImageSeed = { id: string; alt: string };

export type UserSeed = {
  id: string;
  username: string;
  name: string;
  description: string;
  password: string;
  profileImageId: string;
  createdAt: string;
};

export type ImageSeed = { id: string; alt: string; width: number; height: number; createdAt: string };

export type MovieSeed = { id: string };

export type SoundSeed = { id: string; title: string; artist: string; max: number; peaks: number[] };

export type PostSeed = {
  id: string;
  userId: string;
  movieId: string | null;
  soundId: string | null;
  text: string;
  createdAt: string;
};

export type PostsImagesRelationSeed = { postId: string; imageId: string };

export type CommentSeed = { id: string; userId: string; postId: string; text: string; createdAt: string };

export type DirectMessageConversationSeed = { id: string; initiatorId: string; memberId: string };

export type DirectMessageSeed = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  isRead: boolean | number;
  createdAt: string;
  updatedAt: string;
};

export type QaSuggestionSeed = { id: string; question: string };
