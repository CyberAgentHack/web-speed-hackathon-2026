import {
  CreationOptional,
  DataTypes,
  FindOptions,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  UUIDV4,
} from "sequelize";

import { Movie } from "@web-speed-hackathon-2026/server/src/models/Movie";
import { Sound } from "@web-speed-hackathon-2026/server/src/models/Sound";
import { User } from "@web-speed-hackathon-2026/server/src/models/User";

/** Common find options that were previously in defaultScope */
export const POST_FULL_SCOPE: FindOptions = {
  attributes: {
    exclude: ["userId", "movieId", "soundId"],
  },
  include: [
    {
      association: "user",
      attributes: { exclude: ["profileImageId"] },
      include: [{ association: "profileImage" }],
    },
    {
      association: "images",
      through: { attributes: [] },
    },
    { association: "movie" },
    { association: "sound" },
  ],
  order: [
    ["id", "DESC"],
    ["images", "createdAt", "ASC"],
  ],
};

export class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: string;
  declare userId: ForeignKey<User["id"]>;
  declare movieId?: ForeignKey<Movie["id"]>;
  declare soundId?: ForeignKey<Sound["id"]>;
  declare text: string;
  declare createdAt: CreationOptional<Date>;
}

export function initPost(sequelize: Sequelize) {
  Post.init(
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
    },
  );
}
