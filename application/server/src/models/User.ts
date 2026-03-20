import bcrypt from "bcrypt";
import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
  UUIDV4,
} from "sequelize";

import { Post } from "@web-speed-hackathon-2026/server/src/models/Post";
import { ProfileImage } from "@web-speed-hackathon-2026/server/src/models/ProfileImage";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: string;
  declare username: string;
  declare name: string;
  declare description: string;
  declare password: string;
  declare profileImageId: CreationOptional<ForeignKey<ProfileImage["id"]>>;
  declare createdAt: CreationOptional<Date>;

  declare posts?: NonAttribute<Post>[];
  declare profileImage?: NonAttribute<ProfileImage>;

  generateHash(password: string): string {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
  }
  validPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.getDataValue("password"));
  }
}

export const DEFAULT_PROFILE_IMAGE_ID = "396fe4ce-aa36-4d96-b54e-6db40bae2eed";

export function initUser(sequelize: Sequelize) {
  User.init(
    {
      description: {
        allowNull: false,
        defaultValue: "",
        type: DataTypes.STRING,
      },
      id: {
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      password: {
        allowNull: false,
        get() {
          return undefined;
        },
        set(value: string) {
          this.setDataValue("password", this.generateHash(value));
        },
        type: DataTypes.STRING,
      },
      profileImageId: {
        allowNull: false,
        defaultValue: DEFAULT_PROFILE_IMAGE_ID,
        type: DataTypes.UUID,
      },
      username: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
        validate: {
          is: /^[a-z0-9_-]+$/i,
        },
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      defaultScope: {
        attributes: { exclude: ["profileImageId"] },
        include: { association: "profileImage" },
      },
    },
  );
}
