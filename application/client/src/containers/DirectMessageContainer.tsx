import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import type { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import {
  fetchJSON,
  sendJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface DmUpdateEvent {
  type: "dm:conversation:message";
  payload: Models.DirectMessage;
}
interface DmTypingEvent {
  type: "dm:conversation:typing";
  payload: {};
}

interface DmMessagesResponse {
  messages: Models.DirectMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

const TYPING_INDICATOR_DURATION_MS = 10 * 1000;

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageContainer = ({ activeUser, authModalId }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] =
    useState<Models.DirectMessageConversation | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(
    null,
  );
  const [messages, setMessages] = useState<Models.DirectMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const cursorRef = useRef<{ nextCursor: string | null; hasMore: boolean }>({
    nextCursor: null,
    hasMore: true,
  });

  const sendRead = useCallback(async () => {
    await sendJSON(`/api/v1/dm/${conversationId}/read`, {});
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;

    setMessages([]);
    setConversation(null);
    setConversationError(null);
    cursorRef.current = { nextCursor: null, hasMore: true };

    void (async () => {
      if (activeUser == null) return;

      try {
        const [convData, msgData] = await Promise.all([
          fetchJSON<Models.DirectMessageConversation>(`/api/v1/dm/${conversationId}`),
          fetchJSON<DmMessagesResponse>(`/api/v1/dm/${conversationId}/messages`),
        ]);
        if (cancelled) return;
        setConversation(convData);
        setConversationError(null);
        setMessages(msgData.messages);
        cursorRef.current = {
          nextCursor: msgData.nextCursor,
          hasMore: msgData.hasMore,
        };
      } catch (error) {
        if (cancelled) return;
        setConversation(null);
        setConversationError(error as Error);
      }

      void sendRead();
    })();

    return () => {
      cancelled = true;
    };
  }, [activeUser, conversationId, sendRead]);

  const handleSubmit = useCallback(
    async (params: DirectMessageFormData) => {
      setIsSubmitting(true);
      try {
        const newMessage = await sendJSON<Models.DirectMessage>(
          `/api/v1/dm/${conversationId}/messages`,
          { body: params.body },
        );
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
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

  useWs(
    `/api/v1/dm/${conversationId}`,
    (event: DmUpdateEvent | DmTypingEvent) => {
      if (event.type === "dm:conversation:message") {
        const newMsg = event.payload;
        setMessages((prev) => {
          const existingIndex = prev.findIndex((m) => m.id === newMsg.id);
          if (existingIndex !== -1) {
            // Update existing message (e.g. isRead status change)
            const updated = [...prev];
            updated[existingIndex] = newMsg;
            return updated;
          }
          return [...prev, newMsg];
        });
        if (newMsg.sender.id !== activeUser?.id) {
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
    },
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

  const peer =
    conversation.initiator.id !== activeUser?.id
      ? conversation.initiator
      : conversation.member;

  return (
    <>
      <Helmet>
        <title>{peer.name} さんとのダイレクトメッセージ - CaX</title>
      </Helmet>
      <DirectMessagePage
        conversationError={conversationError}
        conversation={conversation}
        messages={messages}
        activeUser={activeUser}
        onTyping={handleTyping}
        isPeerTyping={isPeerTyping}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </>
  );
};
