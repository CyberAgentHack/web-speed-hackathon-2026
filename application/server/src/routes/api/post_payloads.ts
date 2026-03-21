import { FindOptions, Order, WhereOptions } from "sequelize";

import { Comment } from "@web-speed-hackathon-2026/server/src/models/Comment";
import { Image } from "@web-speed-hackathon-2026/server/src/models/Image";
import { Post } from "@web-speed-hackathon-2026/server/src/models/Post";

const POST_PAYLOAD_ORDER: Order = [
  ["id", "DESC"],
  [{ as: "images", model: Image }, "createdAt", "ASC"],
];

const COMMENT_PAYLOAD_ORDER: Order = [["createdAt", "ASC"]];

export function createPostPayloadQuery({
  limit,
  offset,
  where,
}: {
  limit?: number;
  offset?: number;
  where?: WhereOptions;
}): FindOptions<Post> {
  return {
    attributes: ["id", "text", "createdAt"],
    include: [
      {
        association: "user",
        attributes: ["id", "name", "username"],
        include: [{ association: "profileImage", attributes: ["id", "alt"] }],
      },
      {
        association: "images",
        attributes: ["id", "alt", "createdAt"],
        required: false,
        through: { attributes: [] },
      },
      {
        association: "movie",
        attributes: ["id"],
        required: false,
      },
      {
        association: "sound",
        attributes: ["artist", "id", "title"],
        required: false,
      },
    ],
    limit,
    offset,
    order: POST_PAYLOAD_ORDER,
    where,
  };
}

export function createCommentPayloadQuery({
  limit,
  offset,
  where,
}: {
  limit?: number;
  offset?: number;
  where?: WhereOptions;
}): FindOptions<Comment> {
  return {
    attributes: ["id", "text", "createdAt"],
    include: [
      {
        association: "user",
        attributes: ["id", "name", "username"],
        include: [{ association: "profileImage", attributes: ["id", "alt"] }],
      },
    ],
    limit,
    offset,
    order: COMMENT_PAYLOAD_ORDER,
    where,
  };
}
