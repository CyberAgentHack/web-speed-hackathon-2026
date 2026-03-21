import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import {
  fetchPreloadedJSON,
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

const TYPING_INDICATOR_DURATION_MS = 10 * 1000;
const TYPING_EVENT_INTERVAL_MS = 1_000;

interface Props {
  activeUser: Models.User | null;
  isLoadingActiveUser: boolean;
  onOpenAuthModal: () => void;
}

function upsertConversationMessage(
  conversation: Models.DirectMessageConversation,
  message: Models.DirectMessage,
): Models.DirectMessageConversation {
  const currentMessageIndex = conversation.messages.findIndex(
    (currentMessage) => currentMessage.id === message.id,
  );

  if (currentMessageIndex === -1) {
    return {
      ...conversation,
      messages: [...conversation.messages, message],
    };
  }

  const nextMessages = [...conversation.messages];
  nextMessages[currentMessageIndex] = message;
  return {
    ...conversation,
    messages: nextMessages,
  };
}

export const DirectMessageContainer = ({
  activeUser,
  isLoadingActiveUser,
  onOpenAuthModal,
}: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAtRef = useRef({
    conversationId,
    sentAt: 0,
  });

  const loadConversation = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    try {
      const data = await fetchPreloadedJSON<Models.DirectMessageConversation>(
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
    if (activeUser == null) {
      return;
    }
    await sendJSON(`/api/v1/dm/${conversationId}/read`, {});
  }, [activeUser, conversationId]);

  const applyMessage = useCallback((message: Models.DirectMessage) => {
    startTransition(() => {
      setConversation((currentConversation) => {
        if (currentConversation == null) {
          return currentConversation;
        }

        return upsertConversationMessage(currentConversation, message);
      });
    });
  }, []);

  useEffect(() => {
    if (isLoadingActiveUser || activeUser == null) {
      return;
    }
    void loadConversation();
    void sendRead();
  }, [activeUser, isLoadingActiveUser, loadConversation, sendRead]);

  const handleSubmit = useCallback(
    async (params: DirectMessageFormData) => {
      setIsSubmitting(true);
      try {
        const message = await sendJSON<Models.DirectMessage>(`/api/v1/dm/${conversationId}/messages`, {
          body: params.body,
        });
        applyMessage(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyMessage, conversationId],
  );

  const handleTyping = useCallback(() => {
    const now = Date.now();
    if (lastTypingSentAtRef.current.conversationId !== conversationId) {
      lastTypingSentAtRef.current = {
        conversationId,
        sentAt: 0,
      };
    }

    if (now - lastTypingSentAtRef.current.sentAt < TYPING_EVENT_INTERVAL_MS) {
      return;
    }

    lastTypingSentAtRef.current = {
      conversationId,
      sentAt: now,
    };
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
  }, [conversationId]);

  useEffect(() => {
    setConversation(null);
    setConversationError(null);
    setIsPeerTyping(false);
  }, [conversationId]);

  useEffect(
    () => () => {
      if (peerTypingTimeoutRef.current !== null) {
        clearTimeout(peerTypingTimeoutRef.current);
      }
    },
    [],
  );

  useWs(
    activeUser != null && !isLoadingActiveUser ? `/api/v1/dm/${conversationId}` : "",
    (event: DmUpdateEvent | DmTypingEvent) => {
      if (event.type === "dm:conversation:message") {
        applyMessage(event.payload);

        if (event.payload.sender.id !== activeUser?.id) {
          setIsPeerTyping(false);
          if (peerTypingTimeoutRef.current !== null) {
            clearTimeout(peerTypingTimeoutRef.current);
          }
          peerTypingTimeoutRef.current = null;
        }

        if (event.payload.sender.id !== activeUser?.id && !event.payload.isRead) {
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
    },
  );

  if (isLoadingActiveUser) {
    return (
      <section className="space-y-4 px-6 py-12 text-center">
        <Helmet>
          <title>ダイレクトメッセージ - CaX</title>
        </Helmet>
        <p className="text-cax-text-muted text-sm">読み込み中...</p>
      </section>
    );
  }

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインしてください"
        onOpenAuthModal={onOpenAuthModal}
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
