// API response types — JSON-serialized representations of domain models.
// These types are the source of truth for both server (c.json<T>()) and
// client (inferred by hono/client).

export interface ProfileImageResponse {
  alt: string;
  id: string;
}

export interface UserResponse {
  createdAt: string;
  description: string;
  id: string;
  name: string;
  password: string;
  profileImage: ProfileImageResponse;
  username: string;
}

export interface ImageResponse {
  alt: string;
  id: string;
}

export interface SoundResponse {
  artist: string;
  id: string;
  title: string;
}

export interface MovieResponse {
  id: string;
}

export interface PostResponse {
  createdAt: string;
  id: string;
  images: ImageResponse[];
  movie: MovieResponse | null;
  sound: SoundResponse | null;
  text: string;
  user: UserResponse;
}

export interface CommentResponse {
  createdAt: string;
  id: string;
  post: PostResponse;
  text: string;
  user: UserResponse;
}

export interface DirectMessageResponse {
  id: string;
  sender: UserResponse;
  body: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMessageConversationResponse {
  id: string;
  initiator: UserResponse;
  member: UserResponse;
  messages: DirectMessageResponse[];
  hasUnread?: boolean;
}
