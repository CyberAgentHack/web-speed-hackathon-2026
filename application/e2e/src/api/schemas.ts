import * as v from "valibot";

// ISO 8601 date string: "2026-01-31T23:56:22.307Z"
const isoDate = v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/));
const uuid = v.pipe(v.string(), v.uuid());

export const ProfileImageSchema = v.strictObject({
  id: uuid,
  alt: v.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const UserSchema = v.strictObject({
  id: uuid,
  username: v.string(),
  name: v.string(),
  description: v.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
  profileImage: ProfileImageSchema,
}); // password, profileImageId must NOT be present

export const ImageSchema = v.strictObject({
  id: uuid,
  alt: v.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const MovieSchema = v.strictObject({
  id: uuid,
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const SoundSchema = v.strictObject({
  id: uuid,
  title: v.string(),
  artist: v.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const PostDetailSchema = v.object({
  id: uuid,
  text: v.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
  userId: uuid,
  movieId: v.nullable(uuid),
  soundId: v.nullable(uuid),
  user: UserSchema,
  images: v.array(ImageSchema),
  movie: v.nullable(MovieSchema),
  sound: v.nullable(SoundSchema),
});

export const CommentSchema = v.strictObject({
  id: uuid,
  text: v.string(),
  createdAt: isoDate,
  updatedAt: isoDate,
  user: UserSchema,
}); // userId, postId must NOT be present

export const DirectMessageSchema = v.object({
  id: uuid,
  body: v.string(),
  isRead: v.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
  senderId: uuid,
  conversationId: uuid,
  sender: UserSchema,
});

export const ConversationSchema = v.object({
  id: uuid,
  initiatorId: uuid,
  memberId: uuid,
  createdAt: isoDate,
  updatedAt: isoDate,
  initiator: UserSchema,
  member: UserSchema,
  messages: v.array(DirectMessageSchema),
});

export const SuggestionsSchema = v.object({
  suggestions: v.array(v.string()),
});

export const AuthErrorSchema = v.object({
  code: v.picklist(["USERNAME_TAKEN", "INVALID_USERNAME"]),
});
