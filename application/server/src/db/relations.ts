import { relations } from "drizzle-orm";

import {
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

export const profileImagesRelations = relations(profileImages, () => ({}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profileImage: one(profileImages, {
    fields: [users.profileImageId],
    references: [profileImages.id],
  }),
  posts: many(posts),
  sentMessages: many(directMessages),
}));

export const imagesRelations = relations(images, ({ many }) => ({
  postsImages: many(postsImagesRelations),
}));

export const moviesRelations = relations(movies, () => ({}));

export const soundsRelations = relations(sounds, () => ({}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  movie: one(movies, {
    fields: [posts.movieId],
    references: [movies.id],
  }),
  sound: one(sounds, {
    fields: [posts.soundId],
    references: [sounds.id],
  }),
  postsImages: many(postsImagesRelations),
  comments: many(comments),
}));

export const postsImagesRelationsRelations = relations(postsImagesRelations, ({ one }) => ({
  post: one(posts, {
    fields: [postsImagesRelations.postId],
    references: [posts.id],
  }),
  image: one(images, {
    fields: [postsImagesRelations.imageId],
    references: [images.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

export const directMessageConversationsRelations = relations(
  directMessageConversations,
  ({ one, many }) => ({
    initiator: one(users, {
      fields: [directMessageConversations.initiatorId],
      references: [users.id],
      relationName: "initiator",
    }),
    member: one(users, {
      fields: [directMessageConversations.memberId],
      references: [users.id],
      relationName: "member",
    }),
    messages: many(directMessages),
  }),
);

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
  }),
  conversation: one(directMessageConversations, {
    fields: [directMessages.conversationId],
    references: [directMessageConversations.id],
  }),
}));
