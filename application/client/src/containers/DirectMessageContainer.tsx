import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "@web-speed-hackathon-2026/client/src/components/foundation/Helmet";
import { useParams } from "react-router";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
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
const DIRECT_MESSAGE_PAGE_LIMIT = 50;

interface DirectMessageConversationPayload extends Models.DirectMessageConversation {
  hasMoreBefore: boolean;
}

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

function mergeMessage(
  messages: Models.DirectMessage[],
  incomingMessage: Models.DirectMessage,
): Models.DirectMessage[] {
  const existingIndex = messages.findIndex((message) => message.id === incomingMessage.id);

  if (existingIndex === -1) {
    return [...messages, incomingMessage];
  }

  return messages.map((message, idx) => {
    return idx === existingIndex ? incomingMessage : message;
  });
}

export const DirectMessageContainer = ({ activeUser, authModalId }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const [hasMoreBefore, setHasMoreBefore] = useState(false);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversation = useCallback(async ({ before, prepend = false }: { before?: string; prepend?: boolean } = {}) => {
    if (activeUser == null) {
      return;
    }

    try {
      const params = new URLSearchParams({
        limit: String(DIRECT_MESSAGE_PAGE_LIMIT),
      });
      if (before != null) {
        params.set("before", before);
      }

      const data = await fetchJSON<DirectMessageConversationPayload>(
        `/api/v1/dm/${conversationId}?${params.toString()}`,
      );
      setConversation((current) => {
        if (!prepend || current == null) {
          return data;
        }

        const currentIds = new Set(current.messages.map((message) => message.id));
        return {
          ...data,
          messages: [
            ...data.messages.filter((message) => !currentIds.has(message.id)),
            ...current.messages,
          ],
        };
      });
      setHasMoreBefore(data.hasMoreBefore);
      setConversationError(null);
    } catch (error) {
      if (!prepend) {
        setConversation(null);
      }
      setConversationError(error as Error);
    } finally {
      if (prepend) {
        setIsLoadingOlder(false);
      }
    }
  }, [activeUser, conversationId]);

  const handleLoadOlder = useCallback(async () => {
    if (conversation == null || isLoadingOlder) {
      return;
    }

    const oldestMessage = conversation.messages[0];
    if (oldestMessage == null) {
      return;
    }

    setIsLoadingOlder(true);
    await loadConversation({ before: oldestMessage.createdAt, prepend: true });
  }, [conversation, isLoadingOlder, loadConversation]);

  const sendRead = useCallback(async () => {
    if (activeUser == null) {
      return;
    }
    await sendJSON(`/api/v1/dm/${conversationId}/read`, {});
  }, [activeUser, conversationId]);

  useEffect(() => {
    if (activeUser == null) {
      return;
    }
    void loadConversation();
    void sendRead();
  }, [activeUser, loadConversation, sendRead]);

  const handleSubmit = useCallback(
    async (params: DirectMessageFormData) => {
      setIsSubmitting(true);
      try {
        const message = await sendJSON<Models.DirectMessage>(`/api/v1/dm/${conversationId}/messages`, {
          body: params.body,
        });
        setConversation((current) => {
          if (current == null || current.messages.some((item) => item.id === message.id)) {
            return current;
          }

          return {
            ...current,
            messages: [...current.messages, message],
          };
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId],
  );

  const handleTyping = useCallback(async () => {
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
  }, [conversationId]);

  useWs(activeUser == null ? null : `/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      setConversation((current) => {
        if (current == null) {
          return current;
        }

        return {
          ...current,
          messages: mergeMessage(current.messages, event.payload),
        };
      });
      if (event.payload.sender.id !== activeUser?.id) {
        setIsPeerTyping(false);
        if (peerTypingTimeoutRef.current !== null) {
          clearTimeout(peerTypingTimeoutRef.current);
        }
        peerTypingTimeoutRef.current = null;
      }
      void sendRead();
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

  const peer =
    conversation.initiator.id !== activeUser?.id ? conversation.initiator : conversation.member;

  return (
    <>
      <Helmet>
        <title>{peer.name} さんとのダイレクトメッセージ - CaX</title>
      </Helmet>
      <DirectMessagePage
        conversationError={conversationError}
        conversation={conversation}
        activeUser={activeUser}
        hasMoreBefore={hasMoreBefore}
        isLoadingOlder={isLoadingOlder}
        onTyping={handleTyping}
        onLoadOlder={handleLoadOlder}
        isPeerTyping={isPeerTyping}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </>
  );
};
