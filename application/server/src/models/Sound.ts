import {
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
  declare peaks: number[] | null;
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
      peaks: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.JSON,
      },
      title: {
        allowNull: false,
        defaultValue: "Unknown",
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
    },
  );
}
