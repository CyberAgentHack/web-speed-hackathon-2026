import { Sequelize } from "sequelize";

import { Comment, initComment } from "@web-speed-hackathon-2026/server/src/models/Comment";
import {
  countUnreadDirectMessagesForUser,
  DirectMessage,
  initDirectMessage,
} from "@web-speed-hackathon-2026/server/src/models/DirectMessage";
import {
  DirectMessageConversation,
  initDirectMessageConversation,
} from "@web-speed-hackathon-2026/server/src/models/DirectMessageConversation";
import { Image, initImage } from "@web-speed-hackathon-2026/server/src/models/Image";
import { initMovie, Movie } from "@web-speed-hackathon-2026/server/src/models/Movie";
import { initPost, Post } from "@web-speed-hackathon-2026/server/src/models/Post";
import {
  initPostsImagesRelation,
  PostsImagesRelation,
} from "@web-speed-hackathon-2026/server/src/models/PostsImagesRelation";
import {
  initProfileImage,
  ProfileImage,
} from "@web-speed-hackathon-2026/server/src/models/ProfileImage";
import {
  initQaSuggestion,
  QaSuggestion,
} from "@web-speed-hackathon-2026/server/src/models/QaSuggestion";
import { initSound, Sound } from "@web-speed-hackathon-2026/server/src/models/Sound";
import {
  DEFAULT_PROFILE_IMAGE_ID,
  initUser,
  User,
} from "@web-speed-hackathon-2026/server/src/models/User";

export function initModels(sequelize: Sequelize) {
  initUser(sequelize);
  initPost(sequelize);
  initImage(sequelize);
  initMovie(sequelize);
  initSound(sequelize);
  initComment(sequelize);
  initProfileImage(sequelize);
  initPostsImagesRelation(sequelize);
  initDirectMessage(sequelize);
  initDirectMessageConversation(sequelize);
  initQaSuggestion(sequelize);

  User.hasMany(Post, {
    as: "posts",
    foreignKey: {
      allowNull: false,
      name: "userId",
    },
  });
  Post.belongsTo(User, {
    as: "user",
    foreignKey: {
      allowNull: false,
      name: "userId",
    },
  });

  User.hasMany(DirectMessage, {
    as: "sentMessages",
    foreignKey: {
      allowNull: false,
      name: "senderId",
    },
  });

  DirectMessage.belongsTo(User, {
    as: "sender",
    foreignKey: {
      allowNull: false,
      name: "senderId",
    },
  });

  DirectMessageConversation.belongsTo(User, {
    as: "initiator",
    foreignKey: {
      allowNull: false,
      name: "initiatorId",
    },
  });

  DirectMessageConversation.belongsTo(User, {
    as: "member",
    foreignKey: {
      allowNull: false,
      name: "memberId",
    },
  });

  User.hasMany(DirectMessageConversation, {
    as: "initiatedConversations",
    foreignKey: {
      name: "initiatorId",
    },
  });

  User.hasMany(DirectMessageConversation, {
    as: "joinedConversations",
    foreignKey: {
      name: "memberId",
    },
  });

  DirectMessage.belongsTo(DirectMessageConversation, {
    as: "conversation",
    foreignKey: {
      allowNull: false,
      name: "conversationId",
    },
  });

  DirectMessageConversation.hasMany(DirectMessage, {
    as: "messages",
    foreignKey: {
      name: "conversationId",
    },
  });

  User.belongsTo(ProfileImage, {
    as: "profileImage",
    foreignKey: {
      allowNull: false,
      defaultValue: DEFAULT_PROFILE_IMAGE_ID,
      name: "profileImageId",
    },
  });

  Post.belongsToMany(Image, {
    as: "images",
    foreignKey: {
      name: "postId",
    },
    otherKey: {
      name: "imageId",
    },
    through: PostsImagesRelation,
  });

  Post.belongsTo(Movie, {
    as: "movie",
  });

  Post.belongsTo(Sound, {
    as: "sound",
  });

  Post.hasMany(Comment, {
    as: "comments",
    foreignKey: {
      allowNull: false,
      name: "postId",
    },
  });
  Comment.belongsTo(Post, {
    as: "post",
    foreignKey: {
      allowNull: false,
      name: "postId",
    },
  });

  Comment.belongsTo(User, {
    as: "user",
    foreignKey: {
      allowNull: false,
      name: "userId",
    },
  });
}

export {
  User,
  Post,
  Image,
  Movie,
  Sound,
  Comment,
  ProfileImage,
  PostsImagesRelation,
  DirectMessage,
  countUnreadDirectMessagesForUser,
  DirectMessageConversation,
  QaSuggestion,
};
