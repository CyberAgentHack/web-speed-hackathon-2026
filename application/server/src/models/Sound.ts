import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  UUIDV4,
} from "sequelize";

export class Sound extends Model<InferAttributes<Sound>, InferCreationAttributes<Sound>> {
  declare id: string;
  declare title: string;
  declare artist: string;
  declare extension: CreationOptional<string>;
}

export function initSound(sequelize: Sequelize) {
  Sound.init(
    {
      artist: {
        allowNull: false,
        defaultValue: "Unknown",
        type: DataTypes.STRING,
      },
      id: {
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      title: {
        allowNull: false,
        defaultValue: "Unknown",
        type: DataTypes.STRING,
      },
      extension: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("extension") || "mp3";
        },
      },
    },
    {
      sequelize,
    },
  );
}
