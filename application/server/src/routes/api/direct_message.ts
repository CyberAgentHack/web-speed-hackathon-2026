import { Router } from "express";
import httpErrors from "http-errors";
import { col, where, Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

export const directMessageRouter = Router();
const TYPING_STATE_DURATION_MS = 10 * 1000;
const typingStateMap = new Map<string, number>();
const conversationCreationMap = new Map<string, Promise<string>>();

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversations = await DirectMessageConversation.findAll({
    where: {
      [Op.and]: [
        { [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }] },
        where(col("messages.id"), { [Op.not]: null }),
      ],
    },
    order: [[col("messages.createdAt"), "DESC"]],
  });

  const sorted = conversations.map((c) => ({
    ...c.toJSON(),
    messages: c.messages?.reverse(),
  }));

  return res.status(200).type("application/json").send(sorted);
});

directMessageRouter.post("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const peer =
    typeof req.body?.username === "string"
      ? await User.findOne({
          where: {
            username: req.body.username,
          },
          attributes: ["id"],
        })
      : await User.findByPk(req.body?.peerId, {
          attributes: ["id"],
        });
  if (peer === null) {
    throw new httpErrors.NotFound();
  }

  const conversationKey = [req.session.userId, peer.id].sort().join(":");
  const existingPromise = conversationCreationMap.get(conversationKey);
  if (existingPromise !== undefined) {
    const conversationId = await existingPromise;
    return res.status(200).type("application/json").send({ id: conversationId });
  }

  const createConversationPromise = (async () => {
    const existingConversation = await DirectMessageConversation.unscoped().findOne({
      where: {
        [Op.or]: [
          { initiatorId: req.session.userId, memberId: peer.id },
          { initiatorId: peer.id, memberId: req.session.userId },
        ],
      },
      attributes: ["id"],
    });

    if (existingConversation !== null) {
      return existingConversation.id;
    }

    const newConversation = await DirectMessageConversation.unscoped().create({
      initiatorId: req.session.userId,
      memberId: peer.id,
    });

    return newConversation.id;
  })();

  conversationCreationMap.set(conversationKey, createConversationPromise);

  const conversationId = await createConversationPromise.finally(() => {
    conversationCreationMap.delete(conversationKey);
  });

  return res.status(200).type("application/json").send({
    id: conversationId,
  });
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

  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: req.params.conversationId,
      [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  return res.status(200).type("application/json").send(conversation);
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

  const typingStateKey = `${conversation.id}:${peerId}`;
  const latestTypingAt = typingStateMap.get(typingStateKey);
  if (latestTypingAt != null && Date.now() - latestTypingAt < TYPING_STATE_DURATION_MS) {
    req.ws.send(JSON.stringify({ type: "dm:conversation:typing", payload: {} }));
  }
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

  typingStateMap.set(`${conversation.id}:${req.session.userId}`, Date.now());
  eventhub.emit(`dm:conversation/${conversation.id}:typing/${req.session.userId}`, {});

  return res.status(200).type("application/json").send({});
});
