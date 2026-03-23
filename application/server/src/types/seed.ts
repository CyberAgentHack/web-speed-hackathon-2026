import type { InferAttributes } from "sequelize";

import type { Comment } from "@web-speed-hackathon-2026/server/src/models/Comment";
import type { DirectMessage } from "@web-speed-hackathon-2026/server/src/models/DirectMessage";
import type { DirectMessageConversation } from "@web-speed-hackathon-2026/server/src/models/DirectMessageConversation";
import type { Image } from "@web-speed-hackathon-2026/server/src/models/Image";
import type { Movie } from "@web-speed-hackathon-2026/server/src/models/Movie";
import type { Post } from "@web-speed-hackathon-2026/server/src/models/Post";
import type { PostsImagesRelation } from "@web-speed-hackathon-2026/server/src/models/PostsImagesRelation";
import type { ProfileImage } from "@web-speed-hackathon-2026/server/src/models/ProfileImage";
import type { QaSuggestion } from "@web-speed-hackathon-2026/server/src/models/QaSuggestion";
import type { Sound } from "@web-speed-hackathon-2026/server/src/models/Sound";
import type { User } from "@web-speed-hackathon-2026/server/src/models/User";

type DateToString<T> = {
    [K in keyof T]: T[K] extends Date
        ? string
        : T[K] extends Date | null
          ? string | null
          : T[K] extends Date | undefined
            ? string | undefined
            : T[K];
};

export type ProfileImageSeed = Pick<
    InferAttributes<ProfileImage>,
    "id" | "alt"
>;

export type UserSeed = DateToString<
    Pick<
        InferAttributes<User>,
        | "id"
        | "username"
        | "name"
        | "description"
        | "password"
        | "profileImageId"
        | "createdAt"
    >
>;

export type ImageSeed = DateToString<
    Pick<
        InferAttributes<Image>,
        "id" | "alt" | "width" | "height" | "sizeBytes" | "createdAt"
    >
>;

export type MovieSeed = Pick<InferAttributes<Movie>, "id">;

export type SoundSeed = Pick<
    InferAttributes<Sound>,
    "id" | "title" | "artist" | "peaks"
>;

export type PostSeed = DateToString<
    Pick<
        InferAttributes<Post>,
        "id" | "userId" | "movieId" | "soundId" | "text" | "createdAt"
    >
>;

export type PostsImagesRelationSeed = Pick<
    InferAttributes<PostsImagesRelation>,
    "postId" | "imageId"
>;

export type CommentSeed = DateToString<
    Pick<
        InferAttributes<Comment>,
        "id" | "userId" | "postId" | "text" | "createdAt"
    >
>;

export type DirectMessageConversationSeed = Pick<
    InferAttributes<DirectMessageConversation>,
    "id" | "initiatorId" | "memberId"
>;

export type DirectMessageSeed = DateToString<
    Pick<
        InferAttributes<DirectMessage>,
        | "id"
        | "conversationId"
        | "senderId"
        | "body"
        | "isRead"
        | "createdAt"
        | "updatedAt"
    >
>;

export type QaSuggestionSeed = Pick<
    InferAttributes<QaSuggestion>,
    "id" | "question"
>;
