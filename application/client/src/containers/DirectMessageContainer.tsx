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

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageContainer = ({ activeUser, authModalId }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();
  const optimisticMessagesRef = useRef<Models.DirectMessage[]>([]);
  const optimisticRequestSeqRef = useRef(0);

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mergeConversationMessages = useCallback(
    (messages: Models.DirectMessage[]) => {
      const seen = new Set(messages.map((message) => message.id));
      const pending = optimisticMessagesRef.current.filter((message) => !seen.has(message.id));

      return [...messages, ...pending].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    },
    [],
  );

  const loadConversation = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}`,
      );
      setConversation({
        ...data,
        messages: mergeConversationMessages(data.messages),
      });
      setConversationError(null);
    } catch (error) {
      setConversation(null);
      setConversationError(error as Error);
    }
  }, [activeUser, conversationId, mergeConversationMessages]);

  const sendRead = useCallback(async () => {
    if (activeUser == null || conversationId === "") {
      return;
    }
    await sendJSON(`/api/v1/dm/${conversationId}/read`, {});
  }, [activeUser, conversationId]);

  useEffect(() => {
    if (activeUser == null || conversationId === "") {
      return;
    }
    void loadConversation();
    void sendRead();
  }, [activeUser, conversationId, loadConversation, sendRead]);

  const handleSubmit = useCallback(
    async (params: DirectMessageFormData) => {
      if (activeUser == null) {
        return;
      }

      setIsSubmitting(true);
      const requestSeq = optimisticRequestSeqRef.current + 1;
      optimisticRequestSeqRef.current = requestSeq;
      const createdAt = new Date().toISOString();
      const optimisticMessage = {
        body: params.body,
        createdAt,
        id: `optimistic-${requestSeq}`,
        isRead: false,
        sender: {
          id: activeUser.id,
        },
      } as Models.DirectMessage;
      optimisticMessagesRef.current = [...optimisticMessagesRef.current, optimisticMessage];
      setConversation((current) => {
        if (current == null) {
          return current;
        }

        return {
          ...current,
          messages: mergeConversationMessages([...current.messages, optimisticMessage]),
        };
      });

      try {
        const sentMessage = await sendJSON<Models.DirectMessage>(`/api/v1/dm/${conversationId}/messages`, {
          body: params.body,
        });
        optimisticMessagesRef.current = optimisticMessagesRef.current.filter(
          (message) => message.id !== optimisticMessage.id,
        );
        setConversation((current) => {
          if (current == null) {
            return current;
          }

          const nextMessages = current.messages
            .filter((message) => message.id !== optimisticMessage.id)
            .concat(sentMessage);
          return {
            ...current,
            messages: mergeConversationMessages(nextMessages),
          };
        });
        void loadConversation();
      } catch (error) {
        optimisticMessagesRef.current = optimisticMessagesRef.current.filter(
          (message) => message.id !== optimisticMessage.id,
        );
        setConversation((current) => {
          if (current == null) {
            return current;
          }

          return {
            ...current,
            messages: current.messages.filter((message) => message.id !== optimisticMessage.id),
          };
        });
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeUser, conversationId, loadConversation, mergeConversationMessages],
  );

  const handleTyping = useCallback(async () => {
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
  }, [conversationId]);

  useWs(
    `/api/v1/dm/${conversationId}`,
    (event: DmUpdateEvent | DmTypingEvent) => {
      if (event.type === "dm:conversation:message") {
        void loadConversation().then(() => {
          if (event.payload.sender.id !== activeUser?.id) {
            setIsPeerTyping(false);
            if (peerTypingTimeoutRef.current !== null) {
              clearTimeout(peerTypingTimeoutRef.current);
            }
            peerTypingTimeoutRef.current = null;
          }
        });
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
    { delayMs: 5000, enabled: activeUser != null && conversationId !== "" },
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
      />
    </>
  );
};
