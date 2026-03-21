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

export async function countUnreadDirectMessagesForUser(userId: string) {
  return DirectMessage.count({
    distinct: true,
    where: {
      senderId: { [Op.ne]: userId },
      isRead: false,
    },
    include: [
      {
        association: "conversation",
        where: {
          [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
        },
        required: true,
      },
    ],
  });
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
      scopes: {
        withSender: {
          include: [
            {
              association: "sender",
              include: [{ association: "profileImage" }],
            },
          ],
        },
      },
    },
  );

  DirectMessage.addHook("afterCreate", "onDmCreated", async (message) => {
    const directMessage = await DirectMessage.scope("withSender").findByPk(message.get().id);
    const conversation = await DirectMessageConversation.findByPk(directMessage?.conversationId);

    if (directMessage == null || conversation == null) {
      return;
    }

    const receiverId =
      conversation.initiatorId === directMessage.senderId
        ? conversation.memberId
        : conversation.initiatorId;

    const unreadCount = await countUnreadDirectMessagesForUser(receiverId);

    eventhub.emit(`dm:conversation/${conversation.id}:message`, directMessage);
    eventhub.emit(`dm:unread/${receiverId}`, { unreadCount });
  });
}
