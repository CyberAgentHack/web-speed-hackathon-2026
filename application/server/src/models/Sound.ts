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
  declare waveform: string;
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
      waveform: {
        allowNull: false,
        defaultValue: "[]",
        get() {
          const value = this.getDataValue("waveform") as unknown;
          if (typeof value !== "string" || value.length === 0) {
            return [];
          }
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        },
        set(value: unknown) {
          this.setDataValue("waveform", JSON.stringify(Array.isArray(value) ? value : []));
        },
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
    },
  );
}
