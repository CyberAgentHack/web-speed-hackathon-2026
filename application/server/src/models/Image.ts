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
  declare width: number;
  declare height: number;
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
      width: {
        allowNull: false,
        defaultValue: 0,
        type: DataTypes.INTEGER,
      },
      height: {
        allowNull: false,
        defaultValue: 0,
        type: DataTypes.INTEGER,
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
