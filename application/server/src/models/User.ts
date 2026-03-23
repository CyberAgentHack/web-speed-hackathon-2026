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
  declare profileImageId: ForeignKey<ProfileImage["id"]>;
  declare createdAt: CreationOptional<Date>;

  declare posts?: NonAttribute<Post>[];
  declare profileImage?: NonAttribute<ProfileImage>;

  generateHash(password: string): string {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
  }
  async generateHashAsync(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(8);
    return bcrypt.hash(password, salt);
  }
  validPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.getDataValue("password"));
  }
  validPasswordAsync(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.getDataValue("password"));
  }
}

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
          // Store raw password temporarily; hashing is done in beforeCreate/beforeUpdate hooks
          this.setDataValue("password", value);
        },
        type: DataTypes.STRING,
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

  User.addHook("beforeCreate", async (user) => {
    const raw = (user as User).getDataValue("password");
    if (raw) {
      const salt = await bcrypt.genSalt(8);
      (user as User).setDataValue("password", await bcrypt.hash(raw, salt));
    }
  });

  User.addHook("beforeUpdate", async (user) => {
    if ((user as User).changed("password")) {
      const raw = (user as User).getDataValue("password");
      if (raw) {
        const salt = await bcrypt.genSalt(8);
        (user as User).setDataValue("password", await bcrypt.hash(raw, salt));
      }
    }
  });
}
