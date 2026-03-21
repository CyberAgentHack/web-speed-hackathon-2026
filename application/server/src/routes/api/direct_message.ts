import { Router } from "express";
import httpErrors from "http-errors";
import { Op, QueryTypes } from "sequelize";

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

  const userId = req.session.userId;
  const sequelize = DirectMessageConversation.sequelize!;

  // Fetch conversations with only the latest message and unread count via raw SQL
  // to avoid loading all 190k+ messages through Sequelize default scope
  const rows = await sequelize.query<{
    id: string;
    initiatorId: string;
    memberId: string;
    // initiator
    initiator_id: string;
    initiator_username: string;
    initiator_name: string;
    initiator_description: string;
    initiator_createdAt: string;
    initiator_profileImageId: string;
    initiator_pi_id: string;
    initiator_pi_alt: string;
    // member
    member_id: string;
    member_username: string;
    member_name: string;
    member_description: string;
    member_createdAt: string;
    member_profileImageId: string;
    member_pi_id: string;
    member_pi_alt: string;
    // last message
    msg_id: string | null;
    msg_body: string | null;
    msg_isRead: number | null;
    msg_createdAt: string | null;
    msg_updatedAt: string | null;
    msg_senderId: string | null;
    // sender of last message
    sender_id: string | null;
    sender_username: string | null;
    sender_name: string | null;
    sender_description: string | null;
    sender_createdAt: string | null;
    sender_pi_id: string | null;
    sender_pi_alt: string | null;
    // unread count (messages from peer that are unread)
    unreadCount: number;
    lastMsgAt: string | null;
  }>(
    `
    SELECT
      c.id, c.initiatorId, c.memberId,
      -- initiator
      ui.id          AS initiator_id,
      ui.username    AS initiator_username,
      ui.name        AS initiator_name,
      ui.description AS initiator_description,
      ui.createdAt   AS initiator_createdAt,
      ui.profileImageId AS initiator_profileImageId,
      pi_i.id        AS initiator_pi_id,
      pi_i.alt       AS initiator_pi_alt,
      -- member
      um.id          AS member_id,
      um.username    AS member_username,
      um.name        AS member_name,
      um.description AS member_description,
      um.createdAt   AS member_createdAt,
      um.profileImageId AS member_profileImageId,
      pi_m.id        AS member_pi_id,
      pi_m.alt       AS member_pi_alt,
      -- last message
      lm.id          AS msg_id,
      lm.body        AS msg_body,
      lm.isRead      AS msg_isRead,
      lm.createdAt   AS msg_createdAt,
      lm.updatedAt   AS msg_updatedAt,
      lm.senderId    AS msg_senderId,
      -- sender of last message
      us.id          AS sender_id,
      us.username    AS sender_username,
      us.name        AS sender_name,
      us.description AS sender_description,
      us.createdAt   AS sender_createdAt,
      pi_s.id        AS sender_pi_id,
      pi_s.alt       AS sender_pi_alt,
      -- unread count
      (SELECT COUNT(*) FROM DirectMessages dm2
       WHERE dm2.conversationId = c.id
         AND dm2.senderId != :userId
         AND dm2.isRead = 0) AS unreadCount,
      lm.createdAt   AS lastMsgAt
    FROM DirectMessageConversations c
    JOIN Users ui   ON ui.id = c.initiatorId
    JOIN ProfileImages pi_i ON pi_i.id = ui.profileImageId
    JOIN Users um   ON um.id = c.memberId
    JOIN ProfileImages pi_m ON pi_m.id = um.profileImageId
    -- latest message only
    LEFT JOIN DirectMessages lm ON lm.id = (
      SELECT id FROM DirectMessages
      WHERE conversationId = c.id
      ORDER BY createdAt DESC
      LIMIT 1
    )
    LEFT JOIN Users us   ON us.id = lm.senderId
    LEFT JOIN ProfileImages pi_s ON pi_s.id = us.profileImageId
    WHERE (c.initiatorId = :userId OR c.memberId = :userId)
      AND lm.id IS NOT NULL
    ORDER BY lm.createdAt DESC
    `,
    { replacements: { userId }, type: QueryTypes.SELECT },
  );

  const result = rows.map((r) => ({
    id: r.id,
    initiatorId: r.initiatorId,
    memberId: r.memberId,
    unreadCount: r.unreadCount,
    initiator: {
      id: r.initiator_id,
      username: r.initiator_username,
      name: r.initiator_name,
      description: r.initiator_description,
      createdAt: r.initiator_createdAt,
      profileImage: { id: r.initiator_pi_id, alt: r.initiator_pi_alt },
    },
    member: {
      id: r.member_id,
      username: r.member_username,
      name: r.member_name,
      description: r.member_description,
      createdAt: r.member_createdAt,
      profileImage: { id: r.member_pi_id, alt: r.member_pi_alt },
    },
    messages: r.msg_id === null ? [] : [
      {
        id: r.msg_id,
        body: r.msg_body,
        isRead: Boolean(r.msg_isRead),
        createdAt: r.msg_createdAt,
        updatedAt: r.msg_updatedAt,
        conversationId: r.id,
        senderId: r.msg_senderId,
        sender: r.sender_id === null ? null : {
          id: r.sender_id,
          username: r.sender_username,
          name: r.sender_name,
          description: r.sender_description,
          createdAt: r.sender_createdAt,
          profileImage: r.sender_pi_id === null ? null : { id: r.sender_pi_id, alt: r.sender_pi_alt },
        },
      },
    ],
  }));

  return res.status(200).type("application/json").send(result);
});

directMessageRouter.post("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const peerId = typeof req.body?.peerId === "string" ? req.body.peerId : undefined;
  const username = typeof req.body?.username === "string" ? req.body.username : undefined;

  const peer =
    peerId !== undefined
      ? await User.findByPk(peerId)
      : username !== undefined
        ? await User.findOne({ where: { username } })
        : null;

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
