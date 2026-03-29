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
      indexes: [
        { fields: ["initiatorId"] },
        { fields: ["memberId"] },
      ],
      sequelize,
      defaultScope: {
        // DM一覧では会話参加者のみロードし、メッセージは個別エンドポイントで取得する
        include: [
          { association: "initiator", include: [{ association: "profileImage" }] },
          { association: "member", include: [{ association: "profileImage" }] },
        ],
      },
      scopes: {
        // DM詳細・WebSocket接続時に全メッセージを含めてロードする
        withMessages: {
          include: [
            { association: "initiator", include: [{ association: "profileImage" }] },
            { association: "member", include: [{ association: "profileImage" }] },
            {
              association: "messages",
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
