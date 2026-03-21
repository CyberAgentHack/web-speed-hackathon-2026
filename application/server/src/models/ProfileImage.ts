import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  UUIDV4,
} from "sequelize";

export class ProfileImage extends Model<
  InferAttributes<ProfileImage>,
  InferCreationAttributes<ProfileImage>
> {
  declare id: string;
  declare alt: string;
  declare averageColor: string;
}

export function initProfileImage(sequelize: Sequelize) {
  ProfileImage.init(
    {
      alt: {
        allowNull: false,
        defaultValue: "",
        type: DataTypes.STRING,
      },
      averageColor: {
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
    },
    {
      sequelize,
    },
  );
}
