import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize,
    UUIDV4,
} from "sequelize";

export class Image extends Model<
    InferAttributes<Image>,
    InferCreationAttributes<Image>
> {
    declare id: string;
    declare alt: string;
    declare width: CreationOptional<number | null>;
    declare height: CreationOptional<number | null>;
    declare sizeBytes: CreationOptional<number | null>;
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
            width: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            height: {
                allowNull: true,
                type: DataTypes.INTEGER,
            },
            sizeBytes: {
                allowNull: true,
                type: DataTypes.INTEGER,
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
