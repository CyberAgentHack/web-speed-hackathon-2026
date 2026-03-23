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

  // Step 1: conversations取得（messages抜き）
  const conversations = await DirectMessageConversation.unscoped().findAll({
    where: {
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
    include: [
      { association: "initiator", attributes: ["id", "username", "name", "profileImageId"], include: [{ association: "profileImage" }] },
      { association: "member", attributes: ["id", "username", "name", "profileImageId"], include: [{ association: "profileImage" }] },
    ],
  });

  const conversationIds = conversations.map((c) => c.id);
  if (conversationIds.length === 0) {
    return res.status(200).type("application/json").send([]);
  }

  // Step 2: messages一括取得
  const messages = await DirectMessage.unscoped().findAll({
    where: { conversationId: { [Op.in]: conversationIds } },
    order: [["createdAt", "ASC"]],
  });

  // Step 3: sender情報一括取得
  const senderIds = [...new Set(messages.map((m) => m.senderId))];
  const senders = senderIds.length > 0
    ? await User.unscoped().findAll({
        where: { id: { [Op.in]: senderIds } },
        attributes: ["id", "username", "name", "profileImageId"],
        include: [{ association: "profileImage" }],
      })
    : [];
  const senderMap = Object.fromEntries(senders.map((s) => [s.id, s.toJSON()]));

  // Step 4: JS側でマージ
  const messagesByConversation = new Map<string, unknown[]>();
  for (const msg of messages) {
    const json = { ...msg.toJSON(), sender: senderMap[msg.senderId] };
    const list = messagesByConversation.get(msg.conversationId);
    if (list) {
      list.push(json);
    } else {
      messagesByConversation.set(msg.conversationId, [json]);
    }
  }

  // メッセージ有りのconversationのみ、最新メッセージ順でソート
  const result = conversations
    .filter((c) => messagesByConversation.has(c.id))
    .map((c) => ({
      ...c.toJSON(),
      messages: messagesByConversation.get(c.id),
    }))
    .sort((a, b) => {
      const aLast = (a.messages as any[])[(a.messages as any[]).length - 1]?.createdAt;
      const bLast = (b.messages as any[])[(b.messages as any[]).length - 1]?.createdAt;
      return new Date(bLast).getTime() - new Date(aLast).getTime();
    });

  return res.status(200).type("application/json").send(result);
});

directMessageRouter.post("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const peer = await User.findByPk(req.body?.peerId);
  if (peer === null) {
    throw new httpErrors.NotFound();
  }

  const [conversation] = await DirectMessageConversation.unscoped().findOrCreate({
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
    include: [
      { association: "initiator", attributes: ["id", "username", "name", "profileImageId"], include: [{ association: "profileImage" }] },
      { association: "member", attributes: ["id", "username", "name", "profileImageId"], include: [{ association: "profileImage" }] },
    ],
  });
  await conversation.reload({
    include: [
      { association: "initiator", attributes: ["id", "username", "name", "profileImageId"], include: [{ association: "profileImage" }] },
      { association: "member", attributes: ["id", "username", "name", "profileImageId"], include: [{ association: "profileImage" }] },
    ],
  });

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

  // Step 1: conversation取得（messages抜き）
  const conversation = await DirectMessageConversation.unscoped().findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
    include: [
      { association: "initiator", attributes: ["id", "username", "name", "profileImageId"], include: [{ association: "profileImage" }] },
      { association: "member", attributes: ["id", "username", "name", "profileImageId"], include: [{ association: "profileImage" }] },
    ],
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  // Step 2: messages取得
  const messages = await DirectMessage.unscoped().findAll({
    where: { conversationId: conversation.id },
    order: [["createdAt", "ASC"]],
  });

  // Step 3: sender情報（高々2人）
  const senderIds = [...new Set(messages.map((m) => m.senderId))];
  const senders = senderIds.length > 0
    ? await User.unscoped().findAll({
        where: { id: { [Op.in]: senderIds } },
        attributes: ["id", "username", "name", "profileImageId"],
        include: [{ association: "profileImage" }],
      })
    : [];
  const senderMap = Object.fromEntries(senders.map((s) => [s.id, s.toJSON()]));

  // Step 4: マージ
  const result = {
    ...conversation.toJSON(),
    messages: messages.map((m) => ({ ...m.toJSON(), sender: senderMap[m.senderId] })),
  };

  return res.status(200).type("application/json").send(result);
});

directMessageRouter.ws("/dm/:conversationId", async (req, _res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.unscoped().findOne({
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

  const conversation = await DirectMessageConversation.unscoped().findOne({
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

  const conversation = await DirectMessageConversation.unscoped().findOne({
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

  return res.status(200).type("application/json").send({});
});

directMessageRouter.post("/dm/:conversationId/typing", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.unscoped().findByPk(req.params.conversationId);
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${req.session.userId}`, {});

  return res.status(200).type("application/json").send({});
});
