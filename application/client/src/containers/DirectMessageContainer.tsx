import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";

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

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageContainer = ({ activeUser, authModalId }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(null);
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
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: Models.DirectMessage = {
        id: optimisticId,
        body: params.body,
        sender: activeUser!,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, optimisticMessage],
        };
      });

      // 서버 전송은 백그라운드 (await 하지 않음)
      sendJSON(`/api/v1/dm/${conversationId}/messages`, { body: params.body })
        .catch(() => {
          setConversation((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.filter((m) => m.id !== optimisticId),
            };
          });
        });
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
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === newMessage.id)) return prev;
        const optimisticIdx = prev.messages.findIndex(
          (m) => m.id.startsWith("optimistic-") && m.sender.id === newMessage.sender.id && m.body === newMessage.body
        );
        if (optimisticIdx !== -1) {
          const updated = [...prev.messages];
          updated[optimisticIdx] = newMessage;
          return { ...prev, messages: updated };
        }
        return { ...prev, messages: [...prev.messages, newMessage] };
      });

      if (newMessage.sender.id !== activeUser?.id) {
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

  const peer = conversation != null && activeUser != null
    ? (conversation.initiator.id !== activeUser.id ? conversation.initiator : conversation.member)
    : null;

  useTitle(peer ? `${peer.name} さんとのダイレクトメッセージ - CaX` : "ダイレクトメッセージ - CaX");

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
      onSubmit={handleSubmit}
    />
  );
};
