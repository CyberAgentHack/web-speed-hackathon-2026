import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { setPageTitle } from "@web-speed-hackathon-2026/client/src/utils/set_page_title";

interface DmUpdateEvent {
  type: "dm:conversation:message";
  payload: Models.DirectMessage;
}
interface DmTypingEvent {
  type: "dm:conversation:typing";
  payload: {};
}

const TYPING_INDICATOR_DURATION_MS = 10 * 1000;

function mergeMessages(
  current: Models.DirectMessage[] = [],
  incoming: Models.DirectMessage[] = [],
): Models.DirectMessage[] {
  const messagesById = new Map<string, Models.DirectMessage>();

  for (const message of current) {
    messagesById.set(message.id, message);
  }
  for (const message of incoming) {
    messagesById.set(message.id, message);
  }

  return Array.from(messagesById.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageContainer = ({ activeUser, authModalId }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setConversation((prev) => {
        if (prev == null) {
          return data;
        }

        return {
          ...data,
          messages: mergeMessages(prev.messages, data.messages),
        };
      });
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
      setIsSubmitting(true);
      try {
        const newMessage = await sendJSON<Models.DirectMessage>(
          `/api/v1/dm/${conversationId}/messages`,
          {
            body: params.body,
          },
        );
        setConversation((prev) => {
          if (prev == null) {
            return prev;
          }

          return {
            ...prev,
            messages: mergeMessages(prev.messages, [newMessage]),
          };
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId],
  );

  const appendIncomingMessage = useCallback((message: Models.DirectMessage) => {
    setConversation((prev) => {
      if (prev == null) {
        return prev;
      }

      return {
        ...prev,
        messages: mergeMessages(prev.messages, [message]),
      };
    });
  }, []);

  const clearPeerTyping = useCallback(() => {
    setIsPeerTyping(false);
    if (peerTypingTimeoutRef.current !== null) {
      clearTimeout(peerTypingTimeoutRef.current);
      peerTypingTimeoutRef.current = null;
    }
  }, []);

  const showPeerTyping = useCallback(() => {
    setIsPeerTyping(true);
    if (peerTypingTimeoutRef.current !== null) {
      clearTimeout(peerTypingTimeoutRef.current);
    }
    peerTypingTimeoutRef.current = setTimeout(() => {
      setIsPeerTyping(false);
    }, TYPING_INDICATOR_DURATION_MS);
  }, []);

  const handleTyping = useCallback(async () => {
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
  }, [conversationId]);

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      appendIncomingMessage(event.payload);

      if (event.payload.sender.id !== activeUser?.id) {
        clearPeerTyping();
        void loadConversation();
      }

      void sendRead();
      return;
    }

    showPeerTyping();
  });

  const peer =
    activeUser != null && conversation != null
      ? conversation.initiator.id !== activeUser.id
        ? conversation.initiator
        : conversation.member
      : null;

  useEffect(() => {
    if (peer == null) {
      return;
    }
    setPageTitle(`${peer.name} さんとのダイレクトメッセージ - CaX`);
  }, [peer]);

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
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
};
