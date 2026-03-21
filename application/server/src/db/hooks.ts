import { eventhub } from "@web-speed-hackathon-2026/server/src/eventhub";

import type { Database } from "./client";
import { countUnreadMessages, findDmByPk } from "./queries";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

export async function emitDmEvents(db: Database, messageId: string) {
  const message = await findDmByPk(db, messageId);
  if (!message) return;

  const conversation = await db.query.directMessageConversations.findFirst({
    where: eq(schema.directMessageConversations.id, message.conversationId),
  });
  if (!conversation) return;

  const receiverId =
    conversation.initiatorId === message.senderId
      ? conversation.memberId
      : conversation.initiatorId;

  const unreadCount = await countUnreadMessages(db, receiverId);

  eventhub.emit(`dm:conversation/${conversation.id}:message`, message);
  eventhub.emit(`dm:unread/${receiverId}`, { unreadCount });
}
