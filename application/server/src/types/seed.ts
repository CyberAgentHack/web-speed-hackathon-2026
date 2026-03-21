export interface ProfileImageSeed {
  id: string;
  alt: string;
}

export interface UserSeed {
  id: string;
  username: string;
  name: string;
  description: string;
  password: string;
  profileImageId: string;
  createdAt: string;
}

export interface ImageSeed {
  id: string;
  alt: string;
  createdAt: string;
}

export interface MovieSeed {
  id: string;
}

export interface SoundSeed {
  id: string;
  title: string;
  artist: string;
}

export interface PostSeed {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  movieId?: string;
  soundId?: string;
}

export interface PostsImagesRelationSeed {
  postId: string;
  imageId: string;
}

export interface CommentSeed {
  id: string;
  userId: string;
  postId: string;
  text: string;
  createdAt: string;
}

export interface DirectMessageSeed {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
}

export interface DirectMessageConversationSeed {
  id: string;
  initiatorId: string;
  memberId: string;
}
