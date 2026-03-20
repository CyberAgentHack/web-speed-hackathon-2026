import { Router } from "express";
import httpErrors from "http-errors";
import { Op, QueryTypes } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";
import { sequelize } from "../../sequelize";

export const directMessageRouter = Router();

directMessageRouter.get("/dm", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }
  console.time("Load DM Conversations");
  const conversations = await sequelize!.query<{
    id: string;
    // lastMessage
    last_message_id: string;
    last_message_content: string;
    last_message_at: Date;
    last_message_is_read: boolean;
    // lastPeerMessage
    last_peer_message_id: string;
    last_peer_message_content: string;
    last_peer_message_at: Date;
    last_peer_message_is_read: boolean;
    // initiator
    initiator_id: string;
    initiator_name: string;
    initiator_username: string;
    initiator_profile_image_id: string;
    // member
    member_id: string;
    member_name: string;
    member_username: string;
    member_profile_image_id: string;
  }>(
    `
      SELECT
        dmc.id,
        -- lastMessage
        m.id AS last_message_id,
        m.body AS last_message_content,
        m.createdAt AS last_message_at,
        m.isRead AS last_message_is_read,
        -- lastPeerMessage
        peer_m.id AS last_peer_message_id,
        peer_m.body AS last_peer_message_content,
        peer_m.createdAt AS last_peer_message_at,
        peer_m.isRead AS last_peer_message_is_read,
        -- initiator
        u_init.id AS initiator_id,
        u_init.name AS initiator_name,
        u_init.username AS initiator_username,
        pi_init.id AS initiator_profile_image_id,
        -- member
        u_mem.id AS member_id,
        u_mem.name AS member_name,
        u_mem.username AS member_username,
        pi_mem.id AS member_profile_image_id
      FROM DirectMessageConversations dmc
      -- 最新のメッセージ1件だけを紐付けるサブクエリ
      INNER JOIN (
          SELECT conversationId, MAX(createdAt) as max_date
          FROM DirectMessages
          GROUP BY conversationId
      ) latest_msg ON dmc.id = latest_msg.conversationId
      INNER JOIN DirectMessages m ON m.conversationId = latest_msg.conversationId
          AND m.createdAt = latest_msg.max_date
      -- 最新の相手のメッセージ1件だけを紐づける
      LEFT JOIN (
          SELECT conversationId, MAX(createdAt) as max_date
          FROM DirectMessages
          WHERE senderId != :userId
          GROUP BY conversationId
      ) latest_peer_msg ON dmc.id = latest_peer_msg.conversationId
      LEFT JOIN DirectMessages peer_m ON peer_m.conversationId = latest_peer_msg.conversationId
          AND peer_m.createdAt = latest_peer_msg.max_date
      -- ユーザー情報の結合
      LEFT JOIN Users u_init ON dmc.initiatorId = u_init.id
      LEFT JOIN Users u_mem ON dmc.memberId = u_mem.id
      LEFT JOIN ProfileImages pi_init ON u_init.profileImageId = pi_init.id
      LEFT JOIN ProfileImages pi_mem ON u_mem.profileImageId = pi_mem.id
      WHERE dmc.initiatorId = :userId OR dmc.memberId = :userId
      ORDER BY m.createdAt DESC;
  `,
    {
      replacements: { userId: req.session.userId },
      type: QueryTypes.SELECT,
    },
  );

  const result = conversations.map((c) => ({
    id: c.id,
    initiator: {
      id: c.initiator_id,
      name: c.initiator_name,
      username: c.initiator_username,
      profileImage: {
        id: c.initiator_profile_image_id,
      },
    },
    member: {
      id: c.member_id,
      name: c.member_name,
      username: c.member_username,
      profileImage: {
        id: c.member_profile_image_id,
      },
    },
    lastMessage: {
      id: c.last_message_id,
      body: c.last_message_content,
      createdAt: c.last_message_at,
      isRead: c.last_message_is_read,
    },
    lastPeerMessage: c.last_peer_message_id
      ? {
          id: c.last_peer_message_id,
          body: c.last_peer_message_content,
          createdAt: c.last_peer_message_at,
          isRead: c.last_peer_message_is_read,
        }
      : null,
  }));
  console.timeEnd("Load DM Conversations");

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
          [Op.or]: [
            { initiatorId: req.session.userId },
            { memberId: req.session.userId },
          ],
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
      [Op.or]: [
        { initiatorId: req.session.userId },
        { memberId: req.session.userId },
      ],
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
      [Op.or]: [
        { initiatorId: req.session.userId },
        { memberId: req.session.userId },
      ],
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
  eventhub.on(
    `dm:conversation/${conversation.id}:message`,
    handleMessageUpdated,
  );
  req.ws.on("close", () => {
    eventhub.off(
      `dm:conversation/${conversation.id}:message`,
      handleMessageUpdated,
    );
  });

  const handleTyping = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:conversation:typing", payload }));
  };
  eventhub.on(
    `dm:conversation/${conversation.id}:typing/${peerId}`,
    handleTyping,
  );
  req.ws.on("close", () => {
    eventhub.off(
      `dm:conversation/${conversation.id}:typing/${peerId}`,
      handleTyping,
    );
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
      [Op.or]: [
        { initiatorId: req.session.userId },
        { memberId: req.session.userId },
      ],
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
      [Op.or]: [
        { initiatorId: req.session.userId },
        { memberId: req.session.userId },
      ],
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
      where: {
        conversationId: conversation.id,
        senderId: peerId,
        isRead: false,
      },
      individualHooks: true,
    },
  );

  return res.status(200).type("application/json").send({});
});

directMessageRouter.post("/dm/:conversationId/typing", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const conversation = await DirectMessageConversation.findByPk(
    req.params.conversationId,
  );
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  eventhub.emit(
    `dm:conversation/${conversation.id}:typing/${req.session.userId}`,
    {},
  );

  return res.status(200).type("application/json").send({});
});
