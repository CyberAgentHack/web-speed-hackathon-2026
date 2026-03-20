import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  UUIDV4,
} from "sequelize";

export class Image extends Model<InferAttributes<Image>, InferCreationAttributes<Image>> {
  declare id: string;
  declare alt: string;
  declare createdAt: CreationOptional<Date>;
}

export function initImage(sequelize: Sequelize) {
  Image.init(
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
