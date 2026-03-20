import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  UUIDV4,
} from "sequelize";

export class Movie extends Model<InferAttributes<Movie>, InferCreationAttributes<Movie>> {
  declare id: string;
  declare extension: CreationOptional<string>;
}

export function initMovie(sequelize: Sequelize) {
  Movie.init(
    {
      id: {
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      extension: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("extension") || "gif";
        },
      },
    },
    {
      sequelize,
    },
  );
}
