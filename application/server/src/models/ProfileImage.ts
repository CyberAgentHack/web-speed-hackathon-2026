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
  declare width: number | null;
  declare height: number | null;
}

export function initProfileImage(sequelize: Sequelize) {
  ProfileImage.init(
    {
      alt: {
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
      width: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      height: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
    },
  );
}
