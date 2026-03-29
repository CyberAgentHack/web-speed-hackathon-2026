import {
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

import { Image } from "@web-speed-hackathon-2026/server/src/models/Image";
import { Post } from "@web-speed-hackathon-2026/server/src/models/Post";

export class PostsImagesRelation extends Model<
  InferAttributes<PostsImagesRelation>,
  InferCreationAttributes<PostsImagesRelation>
> {
  declare imageId: ForeignKey<Image["id"]>;
  declare postId: ForeignKey<Post["id"]>;
}

export function initPostsImagesRelation(sequelize: Sequelize) {
  PostsImagesRelation.init(
    {
      imageId: {
        references: {
          model: Image,
        },
        type: DataTypes.UUID,
      },
      postId: {
        references: {
          model: Post,
        },
        type: DataTypes.UUID,
      },
    },
    {
      sequelize,
      indexes: [
        { fields: ["postId"] },
        { fields: ["imageId"] },
      ],
    },
  );
}
