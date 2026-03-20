import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Op,
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
        { fields: ["conversationId", "createdAt"] },
        { fields: ["conversationId", "isRead"] },
        { fields: ["conversationId", "senderId", "isRead"] },
        { fields: ["senderId"] },
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

  DirectMessage.addHook("afterSave", "onDmSaved", async (message) => {
    const conversation = await DirectMessageConversation.findByPk(message.conversationId, {
      attributes: ["id", "initiatorId", "memberId"],
    });

    if (conversation == null) {
      return;
    }

    const receiverId =
      conversation.initiatorId === message.senderId
        ? conversation.memberId
        : conversation.initiatorId;

    const unreadCount = await DirectMessage.count({
      distinct: true,
      where: {
        senderId: { [Op.ne]: receiverId },
        isRead: false,
      },
      include: [
        {
          association: "conversation",
          where: {
            [Op.or]: [{ initiatorId: receiverId }, { memberId: receiverId }],
          },
          required: true,
        },
      ],
    });

    eventhub.emit(`dm:conversation/${conversation.id}:message`, {
      id: message.id,
      sender: {
        id: message.senderId,
      },
      body: message.body,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    });
    eventhub.emit(`dm:unread/${receiverId}`, { unreadCount });
  });
}
