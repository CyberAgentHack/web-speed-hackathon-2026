import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { useDocumentTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_document_title";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface DmUpdateEvent {
  type: "dm:conversation:message";
  payload: Models.DirectMessage;
}
interface DmTypingEvent {
  type: "dm:conversation:typing";
  payload: {};
}

const TYPING_INDICATOR_DURATION_MS = 10 * 1000;
const OPTIMISTIC_DM_ID_PREFIX = "optimistic:";

function upsertConversationMessage(
  conversation: Models.DirectMessageConversation,
  message: Models.DirectMessage,
): Models.DirectMessageConversation {
  const index = conversation.messages.findIndex((item) => item.id === message.id);
  if (index === -1) {
    return {
      ...conversation,
      messages: [...conversation.messages, message],
    };
  }

  const messages = [...conversation.messages];
  messages[index] = {
    ...messages[index],
    ...message,
  };

  return {
    ...conversation,
    messages,
  };
}

function replaceConversationMessage(
  conversation: Models.DirectMessageConversation,
  currentId: string,
  nextMessage: Models.DirectMessage,
): Models.DirectMessageConversation {
  const index = conversation.messages.findIndex((item) => item.id === currentId);
  if (index === -1) {
    return upsertConversationMessage(conversation, nextMessage);
  }

  const messages = [...conversation.messages];
  messages[index] = nextMessage;

  return {
    ...conversation,
    messages,
  };
}

function removeConversationMessage(
  conversation: Models.DirectMessageConversation,
  messageId: string,
): Models.DirectMessageConversation {
  return {
    ...conversation,
    messages: conversation.messages.filter((message) => message.id !== messageId),
  };
}

function reconcileOwnMessage(
  conversation: Models.DirectMessageConversation,
  activeUserId: string | undefined,
  message: Models.DirectMessage,
): Models.DirectMessageConversation {
  if (message.sender.id !== activeUserId) {
    return upsertConversationMessage(conversation, message);
  }

  const optimisticMessage = conversation.messages.find(
    (item) =>
      item.id.startsWith(OPTIMISTIC_DM_ID_PREFIX) &&
      item.sender.id === message.sender.id &&
      item.body === message.body,
  );

  if (optimisticMessage == null) {
    return upsertConversationMessage(conversation, message);
  }

  return replaceConversationMessage(conversation, optimisticMessage.id, message);
}

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageContainer = ({ activeUser, authModalId }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [pendingSendCount, setPendingSendCount] = useState(0);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversation = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}`,
      );
      setConversation(data);
      setConversationError(null);
    } catch (error) {
      setConversation(null);
      setConversationError(error as Error);
    }
  }, [activeUser, conversationId]);

  const sendRead = useCallback(async () => {
    await sendJSON(`/api/v1/dm/${conversationId}/read`, {});
  }, [conversationId]);

  useEffect(() => {
    void loadConversation();
    void sendRead();
  }, [loadConversation, sendRead]);

  const handleSubmit = useCallback(
    async (params: DirectMessageFormData) => {
      if (activeUser == null || conversation == null) {
        return;
      }

      const optimisticId = `${OPTIMISTIC_DM_ID_PREFIX}${crypto.randomUUID()}`;
      const optimisticMessage: Models.DirectMessage = {
        id: optimisticId,
        sender: activeUser,
        body: params.body,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setConversation((currentConversation) => {
        if (currentConversation == null) {
          return currentConversation;
        }
        return upsertConversationMessage(currentConversation, optimisticMessage);
      });
      setPendingSendCount((count) => count + 1);

      try {
        const message = await sendJSON<Models.DirectMessage>(
          `/api/v1/dm/${conversationId}/messages`,
          {
            body: params.body,
          },
        );
        setConversation((currentConversation) => {
          if (currentConversation == null) {
            return currentConversation;
          }
          return replaceConversationMessage(currentConversation, optimisticId, message);
        });
      } catch (error) {
        setConversation((currentConversation) => {
          if (currentConversation == null) {
            return currentConversation;
          }
          return removeConversationMessage(currentConversation, optimisticId);
        });
        throw error;
      } finally {
        setPendingSendCount((count) => Math.max(0, count - 1));
      }
    },
    [activeUser, conversation, conversationId],
  );

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTyping = useCallback(() => {
    if (typingTimerRef.current !== null) return;
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
    typingTimerRef.current = setTimeout(() => {
      typingTimerRef.current = null;
    }, 2000);
  }, [conversationId]);

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      setConversation((currentConversation) => {
        if (currentConversation == null) {
          return currentConversation;
        }
        return reconcileOwnMessage(currentConversation, activeUser?.id, event.payload);
      });

      if (event.payload.sender.id !== activeUser?.id) {
        setIsPeerTyping(false);
        if (peerTypingTimeoutRef.current !== null) {
          clearTimeout(peerTypingTimeoutRef.current);
        }
        peerTypingTimeoutRef.current = null;
        void sendRead();
      }
    } else if (event.type === "dm:conversation:typing") {
      setIsPeerTyping(true);
      if (peerTypingTimeoutRef.current !== null) {
        clearTimeout(peerTypingTimeoutRef.current);
      }
      peerTypingTimeoutRef.current = setTimeout(() => {
        setIsPeerTyping(false);
      }, TYPING_INDICATOR_DURATION_MS);
    }
  });

  const peer =
    activeUser !== null && conversation !== null
      ? conversation.initiator.id !== activeUser.id
        ? conversation.initiator
        : conversation.member
      : null;
  useDocumentTitle(
    peer !== null
      ? `${peer.name} さんとのダイレクトメッセージ - CaX`
      : "ダイレクトメッセージ - CaX",
  );

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインしてください"
        authModalId={authModalId}
      />
    );
  }

  if (conversation == null) {
    if (conversationError != null) {
      return <NotFoundContainer />;
    }
    return null;
  }

  return (
    <DirectMessagePage
      conversationError={conversationError}
      conversation={conversation}
      activeUser={activeUser}
      onTyping={handleTyping}
      isPeerTyping={isPeerTyping}
      isSubmitting={pendingSendCount > 0}
      onSubmit={handleSubmit}
    />
  );
};
