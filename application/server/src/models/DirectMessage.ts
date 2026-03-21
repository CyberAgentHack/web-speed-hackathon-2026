import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  QueryTypes,
  Sequelize,
  UUIDV4,
} from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import { DirectMessageConversation } from "@web-speed-hackathon-2026/server/src/models/DirectMessageConversation";
import { User } from "@web-speed-hackathon-2026/server/src/models/User";

export class DirectMessage extends Model<
  InferAttributes<DirectMessage>,
  InferCreationAttributes<DirectMessage>
> {
  declare id: CreationOptional<string>;
  declare conversationId: ForeignKey<DirectMessageConversation["id"]>;
  declare senderId: ForeignKey<User["id"]>;
  declare body: string;
  declare isRead: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare sender?: NonAttribute<User>;
  declare conversation?: NonAttribute<DirectMessageConversation>;
}

export async function countUnreadDirectMessagesForUser(userId: string) {
  const sequelize = DirectMessage.sequelize;
  if (sequelize == null) {
    throw new Error("DirectMessage sequelize is not initialized");
  }

  const [row] = await sequelize.query<{ unreadCount: number | string }>(
    `
      SELECT COUNT(*) AS "unreadCount"
      FROM "DirectMessages"
      WHERE "isRead" = ?
        AND "senderId" != ?
        AND "conversationId" IN (
          SELECT "id"
          FROM "DirectMessageConversations"
          WHERE "initiatorId" = ? OR "memberId" = ?
        )
    `,
    {
      replacements: [false, userId, userId, userId],
      type: QueryTypes.SELECT,
    },
  );

  return Number(row?.unreadCount ?? 0);
}

export function initDirectMessage(sequelize: Sequelize) {
  DirectMessage.init(
    {
      id: {
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
        type: DataTypes.UUID,
      },
      body: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      isRead: {
        allowNull: false,
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      indexes: [
        {
          fields: ["conversationId"],
          name: "direct_messages_conversation_id",
        },
        {
          fields: ["isRead"],
          name: "direct_messages_is_read",
        },
      ],
      defaultScope: {
        include: [
          {
            association: "sender",
            include: [{ association: "profileImage" }],
          },
        ],
        order: [["createdAt", "ASC"]],
      },
    },
  );

  DirectMessage.addHook("afterSave", "onDmSaved", async (message: DirectMessage) => {
    const conversation =
      message.conversation ??
      (await DirectMessageConversation.findByPk(message.conversationId, {
        attributes: ["id", "initiatorId", "memberId"],
      }));

    if (conversation == null) {
      return;
    }

    const receiverId =
      conversation.initiatorId === message.senderId
        ? conversation.memberId
        : conversation.initiatorId;

    const unreadCount = await countUnreadDirectMessagesForUser(receiverId);

    eventhub.emit(`dm:conversation/${conversation.id}:message`, message.toJSON());
    eventhub.emit(`dm:unread/${receiverId}`, { unreadCount });
  });
}
