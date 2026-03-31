import { useCallback, useEffect, useRef, useState } from "react";
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
const PAGE_SIZE = 30;

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageContainer = ({ activeUser, authModalId }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const peer = conversation != null && activeUser != null
    ? (conversation.initiator.id !== activeUser.id ? conversation.initiator : conversation.member)
    : null;
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingMore = useRef(false);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversation = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}?limit=${PAGE_SIZE}`,
      );
      setConversation(data);
      setConversationError(null);
      setHasMore(data.messages.length >= PAGE_SIZE);
    } catch (error) {
      setConversation(null);
      setConversationError(error as Error);
    }
  }, [activeUser, conversationId]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversation || isLoadingMore.current || !hasMore) return;
    isLoadingMore.current = true;

    try {
      const offset = conversation.messages.length;
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      if (data.messages.length < PAGE_SIZE) {
        setHasMore(false);
      }
      if (data.messages.length > 0) {
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...data.messages, ...prev.messages],
          };
        });
      }
    } finally {
      isLoadingMore.current = false;
    }
  }, [conversation, conversationId, hasMore]);

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
        const message = await sendJSON<Models.DirectMessage>(`/api/v1/dm/${conversationId}/messages`, {
          body: params.body,
        });
        setConversation((prev) => {
          if (!prev) return prev;
          const exists = prev.messages.some((m) => m.id === message.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, message],
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

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      // ローカルstateをupsert（既存なら更新、なければ追加）
      setConversation((prev) => {
        if (!prev) return prev;
        const exists = prev.messages.some((m) => m.id === event.payload.id);
        if (exists) {
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === event.payload.id ? event.payload : m,
            ),
          };
        }
        return {
          ...prev,
          messages: [...prev.messages, event.payload],
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
    return <title>ダイレクトメッセージ - CaX</title>;
  }

  return (
    <>
      <title>{peer != null ? `${peer.name} さんとのダイレクトメッセージ - CaX` : "ダイレクトメッセージ - CaX"}</title>
      <DirectMessagePage
        conversationError={conversationError}
        conversation={conversation}
        activeUser={activeUser}
        onTyping={handleTyping}
        isPeerTyping={isPeerTyping}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </>
  );
};
