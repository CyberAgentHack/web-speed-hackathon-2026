import { Router } from "express";
import httpErrors from "http-errors";
import { Op } from "sequelize";

import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";
import {
  countUnreadDirectMessagesForUser,
  DirectMessage,
  DirectMessageConversation,
  User,
} from "@web-speed-hackathon-2026/server/src/models";

export const directMessageRouter = Router();

interface DirectMessageConversationListItem {
  id: string;
  peer: {
    id: string;
    name: string;
    username: string;
    profileImage: {
      id: string;
      alt: string;
    };
  };
  lastMessage: {
    id: string;
    body: string;
    createdAt: Date;
  };
  hasUnread: boolean;
}

type UnreadConversationRow = Pick<DirectMessage, "conversationId">;

const DIRECT_MESSAGE_PAGE_SIZE = 50;
const DIRECT_MESSAGE_PAGE_FETCH_SIZE = DIRECT_MESSAGE_PAGE_SIZE + 1;

const userSummaryInclude = (association: "initiator" | "member") => ({
  association,
  attributes: ["id", "name", "username"],
  include: [{ association: "profileImage", attributes: ["id", "alt"] }],
});

function createOlderMessagesWhereCondition(beforeMessage: Pick<DirectMessage, "createdAt" | "id">) {
  return {
    [Op.or]: [
      {
        createdAt: {
          [Op.lt]: beforeMessage.createdAt,
        },
      },
      {
        [Op.and]: [{ createdAt: beforeMessage.createdAt }, { id: { [Op.lt]: beforeMessage.id } }],
      },
    ],
  };
}

async function getDirectMessageConversationResponse({
  conversationId,
  userId,
  beforeMessageId,
}: {
  conversationId: string;
  userId: string;
  beforeMessageId?: string;
}) {
  const conversation = await DirectMessageConversation.findOne({
    where: {
      id: conversationId,
      [Op.or]: [{ initiatorId: userId }, { memberId: userId }],
    },
  });
  if (conversation === null) {
    throw new httpErrors.NotFound();
  }

  let messageCursorWhere = {};
  if (beforeMessageId !== undefined) {
    const beforeMessage = await DirectMessage.findOne({
      attributes: ["id", "createdAt"],
      where: {
        conversationId: conversation.id,
        id: beforeMessageId,
      },
    });

    if (beforeMessage === null) {
      throw new httpErrors.BadRequest();
    }

    messageCursorWhere = createOlderMessagesWhereCondition(beforeMessage);
  }

  const rawMessages = await DirectMessage.scope("withSender").findAll({
    where: {
      conversationId: conversation.id,
      ...messageCursorWhere,
    },
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    limit: DIRECT_MESSAGE_PAGE_FETCH_SIZE,
  });

  const hasOlderMessages = rawMessages.length > DIRECT_MESSAGE_PAGE_SIZE;
  const messages = rawMessages.slice(0, DIRECT_MESSAGE_PAGE_SIZE).reverse();

  return {
    ...conversation.toJSON(),
    hasOlderMessages,
    messages,
  };
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
      userSummaryInclude("initiator"),
      userSummaryInclude("member"),
      {
        model: DirectMessage.unscoped(),
        as: "messages",
        attributes: ["id", "body", "createdAt"],
        limit: 1,
        order: [
          ["createdAt", "DESC"],
          ["id", "DESC"],
        ],
        separate: true,
        required: false,
      },
    ],
  });

  const unreadConversationRows = await DirectMessage.findAll({
    attributes: ["conversationId"],
    where: {
      senderId: { [Op.ne]: req.session.userId },
      isRead: false,
    },
    include: [
      {
        association: "conversation",
        attributes: [],
        where: {
          [Op.or]: [{ initiatorId: req.session.userId }, { memberId: req.session.userId }],
        },
        required: true,
      },
    ],
    group: ["DirectMessage.conversationId"],
    raw: true,
  });

  const unreadConversationIds = new Set(
    unreadConversationRows.map((row) => (row as UnreadConversationRow).conversationId),
  );

  const listItems = conversations
    .flatMap<DirectMessageConversationListItem>((conversation) => {
      const lastMessage = conversation.messages?.[0];
      if (lastMessage == null) {
        return [];
      }

      const peer =
        conversation.initiatorId !== req.session.userId
          ? conversation.initiator
          : conversation.member;
      if (peer?.profileImage == null) {
        return [];
      }

      return [
        {
          id: conversation.id,
          peer: {
            id: peer.id,
            name: peer.name,
            username: peer.username,
            profileImage: {
              id: peer.profileImage.id,
              alt: peer.profileImage.alt,
            },
          },
          lastMessage: {
            id: lastMessage.id,
            body: lastMessage.body,
            createdAt: lastMessage.createdAt,
          },
          hasUnread: unreadConversationIds.has(conversation.id),
        },
      ];
    })
    .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());

  return res.status(200).type("application/json").send(listItems);
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
  const hydratedConversation = await getDirectMessageConversationResponse({
    conversationId: conversation.id,
    userId: req.session.userId,
  });

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

  const unreadCount = await countUnreadDirectMessagesForUser(req.session.userId);
  eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
});

directMessageRouter.get("/dm/:conversationId", async (req, res) => {
  if (req.session.userId === undefined) {
    throw new httpErrors.Unauthorized();
  }

  const beforeMessageId = req.query["beforeMessageId"];
  if (beforeMessageId !== undefined && typeof beforeMessageId !== "string") {
    throw new httpErrors.BadRequest();
  }

  const conversation = await getDirectMessageConversationResponse({
    conversationId: req.params.conversationId,
    userId: req.session.userId,
    beforeMessageId,
  });

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

  const handleRead = (payload: unknown) => {
    req.ws.send(JSON.stringify({ type: "dm:conversation:read", payload }));
  };
  eventhub.on(`dm:conversation/${conversation.id}:read/${peerId}`, handleRead);
  req.ws.on("close", () => {
    eventhub.off(`dm:conversation/${conversation.id}:read/${peerId}`, handleRead);
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
  const hydratedMessage = await DirectMessage.scope("withSender").findByPk(message.id);

  return res
    .status(201)
    .type("application/json")
    .send(hydratedMessage ?? message);
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

  const [updatedCount] = await DirectMessage.update(
    { isRead: true },
    {
      where: { conversationId: conversation.id, senderId: peerId, isRead: false },
    },
  );

  if (updatedCount > 0) {
    const unreadCount = await countUnreadDirectMessagesForUser(req.session.userId);
    eventhub.emit(`dm:unread/${req.session.userId}`, { unreadCount });
    eventhub.emit(`dm:conversation/${conversation.id}:read/${peerId}`, {});
  }

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
