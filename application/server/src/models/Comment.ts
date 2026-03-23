import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  UUIDV4,
} from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models/Post";
import { User } from "@web-speed-hackathon-2026/server/src/models/User";

export class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  declare id: string;
  declare userId: ForeignKey<User["id"]>;
  declare postId: ForeignKey<Post["id"]>;
  declare text: string;
  declare createdAt: CreationOptional<Date>;
}

export function initComment(sequelize: Sequelize) {
  Comment.init(
    {
      id: {
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      text: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      indexes: [
        { fields: ["postId"] },
        { fields: ["userId"] },
      ],
      defaultScope: {
        attributes: {
          exclude: ["userId", "postId"],
        },
        include: [
          {
            association: "user",
            attributes: { exclude: ["profileImageId", "description"] },
            include: [{ association: "profileImage" }],
          },
        ],
        order: [["createdAt", "ASC"]],
      },
    },
  );
}
