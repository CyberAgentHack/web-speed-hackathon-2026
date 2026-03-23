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
        { fields: ["conversationId"] },
        { fields: ["senderId"] },
        { fields: ["createdAt"] },
      ],
      defaultScope: {
        include: [
          {
            association: "sender",
            attributes: { exclude: ["profileImageId", "description"] },
            include: [{ association: "profileImage" }],
          },
        ],
        order: [["createdAt", "ASC"]],
      },
    },
  );

  DirectMessage.addHook("afterSave", "onDmSaved", async (message) => {
    const directMessage = await DirectMessage.findByPk(message.get().id);
    const conversation = await DirectMessageConversation.findByPk(directMessage?.conversationId);

    if (directMessage == null || conversation == null) {
      return;
    }

    const receiverId =
      conversation.initiatorId === directMessage.senderId
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

    eventhub.emit(`dm:conversation/${conversation.id}:message`, directMessage);
    eventhub.emit(`dm:unread/${receiverId}`, { unreadCount });
  });
}
