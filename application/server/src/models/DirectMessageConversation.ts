import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
  UUIDV4,
} from "sequelize";

import { DirectMessage } from "@web-speed-hackathon-2026/server/src/models/DirectMessage";
import { User } from "@web-speed-hackathon-2026/server/src/models/User";

export class DirectMessageConversation extends Model<
  InferAttributes<DirectMessageConversation>,
  InferCreationAttributes<DirectMessageConversation>
> {
  declare id: CreationOptional<string>;
  declare initiatorId: ForeignKey<User["id"]>;
  declare memberId: ForeignKey<User["id"]>;

  declare initiator?: NonAttribute<User>;
  declare member?: NonAttribute<User>;
  declare messages?: NonAttribute<DirectMessage>[];
}

export function initDirectMessageConversation(sequelize: Sequelize) {
  DirectMessageConversation.init(
    {
      id: {
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      initiatorId: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      memberId: {
        allowNull: false,
        type: DataTypes.UUID,
      },
    },
    {
      sequelize,
      defaultScope: {
        include: [
          { association: "initiator", include: [{ association: "profileImage" }] },
          { association: "member", include: [{ association: "profileImage" }] },
        ],
      },
      scopes: {
        withMessages: {
          include: [
            {
              association: "messages",
              separate: true,
              include: [{ association: "sender", include: [{ association: "profileImage" }] }],
              order: [["createdAt", "ASC"]],
              required: false,
            },
          ],
        },
      },
    },
  );
}
