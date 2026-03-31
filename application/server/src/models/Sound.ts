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
  declare waveform: number[];
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
          // 内部的にはJSON文字列で保存するが、型はnumber[]として公開する
          this.setDataValue("waveform", JSON.stringify(Array.isArray(value) ? value : []) as unknown as number[]);
        },
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
    },
  );
}
