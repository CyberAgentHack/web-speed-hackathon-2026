import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
  UUIDV4,
} from "sequelize";

export class QaSuggestion extends Model<
  InferAttributes<QaSuggestion>,
  InferCreationAttributes<QaSuggestion>
> {
  declare id: CreationOptional<string>;
  declare question: string;
}

export function initQaSuggestion(sequelize: Sequelize) {
  QaSuggestion.init(
    {
      id: {
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      question: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      tableName: "qa_suggestions",
      timestamps: false,
    },
  );
}
