import { Router } from "express";
import httpErrors from "http-errors";
import { Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

export const directMessageRouter = Router();

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

  if (conversations.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  const conversationIds = conversations.map((c) => c.id);

  // Batch: fetch last message per conversation in one query
  const allLastMessages = await DirectMessage.unscoped().findAll({
    where: { conversationId: { [Op.in]: conversationIds } },
    attributes: [
      "id", "conversationId", "senderId", "body", "isRead", "createdAt", "updatedAt",
      [DirectMessage.sequelize!.literal(
        `ROW_NUMBER() OVER (PARTITION BY "DirectMessage"."conversationId" ORDER BY "DirectMessage"."createdAt" DESC)`
      ), "rn"],
    ],
    include: [{ association: "sender", include: [{ association: "profileImage" }] }],
  });
  const lastMessageMap = new Map<string, typeof allLastMessages[0]>();
  for (const msg of allLastMessages) {
    if ((msg.get("rn" as keyof typeof msg) as unknown as number) === 1) {
      lastMessageMap.set(msg.conversationId, msg);
    }
  }

  // Batch: count unread per conversation in one query
  const unreadCounts = await DirectMessage.unscoped().findAll({
    where: {
      conversationId: { [Op.in]: conversationIds },
      senderId: { [Op.ne]: req.session.userId },
      isRead: false,
    },
    attributes: [
      "conversationId",
      [DirectMessage.sequelize!.fn("COUNT", DirectMessage.sequelize!.col("id")), "cnt"],
    ],
    group: ["conversationId"],
    raw: true,
  });
  const unreadMap = new Map<string, number>();
  for (const row of unreadCounts as any[]) {
    unreadMap.set(row.conversationId, Number(row.cnt));
  }

  const filtered = conversations
    .map((conv) => {
      const lastMessage = lastMessageMap.get(conv.id);
      if (!lastMessage) return null;
      return {
        ...conv.toJSON(),
        messages: [lastMessage.toJSON()],
        hasUnread: (unreadMap.get(conv.id) ?? 0) > 0,
        totalMessages: 0,
      };
    })
    .filter((c) => c != null)
    .sort(
      (a, b) =>
        new Date(b!.messages[0]!.createdAt).getTime() -
        new Date(a!.messages[0]!.createdAt).getTime(),
    );

  return res.status(200).type("application/json").send(filtered);
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

directMessageRouter.get("/dm/:conversationId", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const limit = Math.min(Number(req.query["limit"]) || 50, 100);
  const offset = Number(req.query["offset"]) || 0;

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

  const [totalMessages, messages] = await Promise.all([
    DirectMessage.count({
      where: { conversationId: conversation.id },
    }),
    DirectMessage.findAll({
      where: { conversationId: conversation.id },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    }),
  ]);
  messages.reverse();

  return res.status(200).type("application/json").send({
    ...conversation.toJSON(),
    messages: messages.map((m) => m.toJSON()),
    totalMessages,
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
    },
  );

  // Manually emit unread count update (instead of triggering afterSave for each row)
  const unreadCount = await DirectMessage.unscoped().count({
    where: {
      senderId: { [Op.ne]: req.session.userId },
      isRead: false,
      conversationId: {
        [Op.in]: DirectMessage.sequelize!.literal(
          `(SELECT "id" FROM "DirectMessageConversations" WHERE "initiatorId" = '${req.session.userId}' OR "memberId" = '${req.session.userId}')`
        ),
      },
    },
  });
  eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });

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
