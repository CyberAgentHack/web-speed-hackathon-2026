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
  declare width: CreationOptional<number | null>;
  declare height: CreationOptional<number | null>;
}

export function initMovie(sequelize: Sequelize) {
  Movie.init(
    {
      height: {
        allowNull: true,
        type: DataTypes.INTEGER,
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
    },
    {
      sequelize,
    },
  );
}
