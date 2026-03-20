import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  UUIDV4,
} from "sequelize";

export class Movie extends Model<InferAttributes<Movie>, InferCreationAttributes<Movie>> {
  declare id: string;
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
    },
    {
      sequelize,
    },
  );
}
