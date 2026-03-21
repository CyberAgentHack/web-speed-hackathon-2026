import { Router } from "express";
import httpErrors from "http-errors";
import { col, fn, Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

export const directMessageRouter = Router();
const DM_MESSAGE_PAGE_SIZE = 50;

interface UnreadRow {
  conversationId: string;
  unreadCount: number | string;
}

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversations = await DirectMessageConversation.unscoped().findAll({
    where: {
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
    include: [
      { association: "initiator", include: [{ association: "profileImage" }] },
      { association: "member", include: [{ association: "profileImage" }] },
    ],
  });
  const conversationIds = conversations.map((conversation) => conversation.id);
  const latestMessages = await Promise.all(
    conversations.map(async (conversation) => {
      const latestMessage = await DirectMessage.unscoped().findOne({
        include: [{ association: "sender", include: [{ association: "profileImage" }] }],
        order: [
          ["createdAt", "DESC"],
          ["id", "DESC"],
        ],
        where: {
          conversationId: conversation.id,
        },
      });

      return [conversation.id, latestMessage] as const;
    }),
  );
  const latestMessageByConversationId = new Map(latestMessages);

  const unreadRows: UnreadRow[] =
    conversationIds.length > 0
      ? ((await DirectMessage.unscoped().findAll({
          attributes: ["conversationId", [fn("COUNT", col("id")), "unreadCount"]],
          group: ["conversationId"],
          raw: true,
          where: {
            conversationId: conversationIds,
            isRead: false,
            senderId: { [Op.ne]: req.session.userId },
          },
        })) as unknown as UnreadRow[])
      : [];
  const unreadByConversationId = new Map(
    unreadRows.map((row) => [String(row.conversationId), Number(row.unreadCount) > 0]),
  );

  const sorted = conversations
    .filter((conversation) => latestMessageByConversationId.get(conversation.id) != null)
    .sort((a, b) => {
      const aCreatedAt = latestMessageByConversationId.get(a.id)?.createdAt;
      const bCreatedAt = latestMessageByConversationId.get(b.id)?.createdAt;
      const aTimestamp = aCreatedAt == null ? 0 : new Date(aCreatedAt).getTime();
      const bTimestamp = bCreatedAt == null ? 0 : new Date(bCreatedAt).getTime();

      if (aTimestamp !== bTimestamp) {
        return bTimestamp - aTimestamp;
      }

      return b.id.localeCompare(a.id);
    })
    .map((conversation) => ({
      ...conversation.toJSON(),
      messages: [latestMessageByConversationId.get(conversation.id)].filter(Boolean),
      hasUnread: unreadByConversationId.get(conversation.id) ?? false,
    }));

  return res.status(200).type("application/json").send(sorted);
});

directMessageRouter.post("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const peer = await User.findByPk(req.body?.peerId);
  if (peer === null) {
    throw new httpErrors.NotFound();
  }

  const [conversation] = await DirectMessageConversation.findOrCreate({
    where: {
      [Op.or]: [
        { initiatorId: req.session.userId, memberId: peer.id },
        { initiatorId: peer.id, memberId: req.session.userId },
      ],
    },
    defaults: {
      initiatorId: req.session.userId,
      memberId: peer.id,
    },
  });
  await conversation.reload();

  return res.status(200).type("application/json").send(conversation);
});

directMessageRouter.ws("/dm/unread", async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const handler = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:unread", payload }));
  };

  eventhub.on(`dm:unread/${req.session.userId}`, handler);
  req.ws.on("close", () => {
    eventhub.off(`dm:unread/${req.session.userId}`, handler);
  });

  const unreadCount = await DirectMessage.count({
    distinct: true,
    where: {
      senderId: { [Op.ne]: req.session.userId },
      isRead: false,
    },
    include: [
      {
        association: "conversation",
        where: {
          [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
        },
        required: true,
      },
    ],
  });

  eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
});

directMessageRouter.ws("/dm/list", async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const handler = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:list:update", payload }));
  };

  eventhub.on(`dm:list/${req.session.userId}`, handler);
  req.ws.on("close", () => {
    eventhub.off(`dm:list/${req.session.userId}`, handler);
  });
});

directMessageRouter.get("/dm/:conversationId", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.unscoped().findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
    include: [
      { association: "initiator", include: [{ association: "profileImage" }] },
      { association: "member", include: [{ association: "profileImage" }] },
    ],
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const before = typeof req.query["before"] === "string" ? req.query["before"] : null;
  const messageWhere =
    before != null
      ? {
          conversationId: conversation.id,
          createdAt: { [Op.lt]: before },
        }
      : {
          conversationId: conversation.id,
        };

  const messages = await DirectMessage.unscoped().findAll({
    include: [
      {
        association: "sender",
        include: [{ association: "profileImage" }],
      },
    ],
    where: messageWhere,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    limit: DM_MESSAGE_PAGE_SIZE,
  });

  const orderedMessages = messages.slice().reverse();
  const oldestLoaded = orderedMessages[0];
  const hasOlderMessages =
    oldestLoaded != null
      ? (await DirectMessage.count({
          where: {
            conversationId: conversation.id,
            createdAt: { [Op.lt]: oldestLoaded.createdAt },
          },
          limit: 1,
        })) > 0
      : false;

  return res.status(200).type("application/json").send({
    ...conversation.toJSON(),
    hasOlderMessages,
    messages: orderedMessages,
  });
});

directMessageRouter.ws("/dm/:conversationId", async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });
  if (conversation == null) {
    throw new httpErrors.NotFound();
  }

  const peerId =
    conversation.initiatorId !== req.session.userId
      ? conversation.initiatorId
      : conversation.memberId;

  const handleMessageUpdated = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:conversation:message", payload }));
  };
  eventhub.on(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);
  req.ws.on("close", () => {
    eventhub.off(`dm:conversation/${conversation.id}:message`, handleMessageUpdated);
  });

  const handleTyping = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:conversation:typing", payload }));
  };
  eventhub.on(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
  req.ws.on("close", () => {
    eventhub.off(`dm:conversation/${conversation.id}:typing/${peerId}`, handleTyping);
  });
});

directMessageRouter.post("/dm/:conversationId/messages", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const body: unknown = req.body?.body;
  if (typeof body !== "string" || body.trim().length === 0) {
    throw new httpErrors.BadRequest();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const message = await DirectMessage.create({
    body: body.trim(),
    conversationId: conversation.id,
    senderId: req.session.userId,
  });
  await message.reload();

  return res.status(201).type("application/json").send(message);
});

directMessageRouter.post("/dm/:conversationId/read", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  const peerId =
    conversation.initiatorId !== req.session.userId
      ? conversation.initiatorId
      : conversation.memberId;

  await DirectMessage.update(
    { isRead: true },
    {
      where: { conversationId: conversation.id, senderId: peerId, isRead: false },
      individualHooks: true,
    },
  );

  eventhub.emit(`dm:list/${req.session.userId}`, {
    conversationId: conversation.id,
    hasUnread: false,
  });

  return res.status(200).type("application/json").send({});
});

directMessageRouter.post("/dm/:conversationId/typing", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findByPk(req.params.conversationId);
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${req.session.userId}`, {});

  return res.status(200).type("application/json").send({});
});
