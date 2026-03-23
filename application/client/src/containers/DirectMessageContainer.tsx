import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
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
const MESSAGES_PER_PAGE = 50;

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageContainer = ({ activeUser, authModalId }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversation = useCallback(async (offset = 0) => {
    if (activeUser == null) {
      return;
    }

    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}?limit=${MESSAGES_PER_PAGE}&offset=${offset}`,
      );

      if (offset === 0) {
        setConversation(data);
      } else {
        setConversation((prev) => {
          if (prev == null) return data;
          return {
            ...prev,
            messages: [...data.messages, ...prev.messages],
          };
        });
      }

      // もし取得件数がページ上限と同じなら、さらに古いメッセージがある可能性がある
      setHasMore(data.messages.length === MESSAGES_PER_PAGE);
      setConversationError(null);
    } catch (error) {
      if (offset === 0) {
        setConversation(null);
        setConversationError(error as Error);
      }
    }
  }, [activeUser, conversationId]);

  const loadMore = useCallback(async () => {
    if (conversation == null || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    await loadConversation(conversation.messages.length);
    setIsLoadingMore(false);
  }, [conversation, isLoadingMore, hasMore, loadConversation]);

  const sendRead = useCallback(async () => {
    await sendJSON(`/api/v1/dm/${conversationId}/read`, {});
  }, [conversationId]);

  useEffect(() => {
    void loadConversation();
    void sendRead();
  }, [loadConversation, sendRead]);

  const handleSubmit = useCallback(
    async (params: DirectMessageFormData) => {
      if (activeUser == null) return;
      
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Models.DirectMessage = {
        id: tempId,
        body: params.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
        sender: activeUser,
      };

      setConversation((prev) => {
        if (prev == null) return null;
        return {
          ...prev,
          messages: [...prev.messages, optimisticMessage],
        };
      });

      setIsSubmitting(true);
      try {
        const newMessage = await sendJSON<Models.DirectMessage>(`/api/v1/dm/${conversationId}/messages`, {
          body: params.body,
        });
        
        setConversation((prev) => {
          if (prev == null) return null;
          return {
            ...prev,
            messages: prev.messages.map((m) => (m.id === tempId ? newMessage : m)),
          };
        });
      } catch (error) {
        setConversation((prev) => {
          if (prev == null) return null;
          return {
            ...prev,
            messages: prev.messages.filter((m) => m.id !== tempId),
          };
        });
        alert("メッセージの送信に失敗しました");
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId, activeUser],
  );

  const handleTyping = useCallback(async () => {
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
  }, [conversationId]);

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      const newMessage = event.payload;
      setConversation((prev) => {
        if (prev == null) return null;
        if (prev.messages.some((m) => m.id === newMessage.id)) return prev;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
        };
      });

      if (newMessage.sender.id !== activeUser?.id) {
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
        onTyping={handleTyping}
        isPeerTyping={isPeerTyping}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
      />
    </>
  );
};
