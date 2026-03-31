import { Router } from "express";
import httpErrors from "http-errors";
import { Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

interface DirectMessageConversationSummary {
  id: string;
  initiator: ReturnType<User["toJSON"]>;
  member: ReturnType<User["toJSON"]>;
  lastMessage: ReturnType<DirectMessage["toJSON"]>;
  hasUnread: boolean;
}

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

  const summaries = (
    await Promise.all(
      conversations.map(
        async (
          conversation,
        ): Promise<
          | {
              conversation: typeof conversation;
              hasUnread: boolean;
              lastMessage: DirectMessage;
            }
          | null
        > => {
        const peerId =
          conversation.initiatorId !== req.session.userId
            ? conversation.initiatorId
            : conversation.memberId;

        const [lastMessage, unreadCount] = await Promise.all([
          DirectMessage.findOne({
            where: {
              conversationId: conversation.id,
            },
            order: [["createdAt", "DESC"]],
          }),
          DirectMessage.count({
            where: {
              conversationId: conversation.id,
              senderId: peerId,
              isRead: false,
            },
          }),
        ]);

        if (
          lastMessage === null ||
          conversation.initiator === undefined ||
          conversation.member === undefined
        ) {
          return null;
        }

        return {
          conversation,
          hasUnread: unreadCount > 0,
          lastMessage,
        };
        },
      ),
    )
  )
    .filter((conversation) => conversation !== null)
    .sort((a, b) => {
      return (
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );
    })
    .map(
      ({ conversation, hasUnread, lastMessage }): DirectMessageConversationSummary => ({
        id: conversation.id,
        initiator: conversation.initiator!.toJSON(),
        member: conversation.member!.toJSON(),
        hasUnread,
        lastMessage: lastMessage.toJSON(),
      }),
    );

  return res.status(200).type("application/json").send(summaries);
});

directMessageRouter.post("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const peerId = typeof req.body?.peerId === "string" ? req.body.peerId : null;
  const username =
    typeof req.body?.username === "string" ? req.body.username.trim().replace(/^@/, "") : null;

  const peer =
    peerId !== null
      ? await User.findByPk(peerId)
      : username !== null && username.length > 0
        ? await User.findOne({ where: { username } })
        : null;
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
  });

  const hydratedConversation = await DirectMessageConversation.findByPk(conversation.id);
  if (hydratedConversation === null) {
    throw new httpErrors.InternalServerError();
  }

  return res.status(200).type("application/json").send(hydratedConversation);
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

  eventhub.emit(`dm:conversation/${conversation.id}:typing/${req.session.userId}`, {});

  return res.status(200).type("application/json").send({});
});
