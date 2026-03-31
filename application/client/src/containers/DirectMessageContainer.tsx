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
const TYPING_REQUEST_DEBOUNCE_MS = 300;

interface Props {
  activeUser: Models.User | null;
  onOpenAuthModal: () => void;
}

function consumeInitialConversation(
  conversationId: string,
): Models.DirectMessageConversation | null {
  if (conversationId === "") {
    return null;
  }

  const key = `dm:conversation:${conversationId}`;
  const raw = sessionStorage.getItem(key);
  if (raw === null) {
    return null;
  }

  sessionStorage.removeItem(key);

  try {
    return JSON.parse(raw) as Models.DirectMessageConversation;
  } catch {
    return null;
  }
}

function upsertConversationMessage(
  conversation: Models.DirectMessageConversation | null,
  message: Models.DirectMessage,
): Models.DirectMessageConversation | null {
  if (conversation === null) {
    return conversation;
  }

  const messageIndex = conversation.messages.findIndex(({ id }) => id === message.id);
  if (messageIndex === -1) {
    return {
      ...conversation,
      messages: [...conversation.messages, message],
    };
  }

  const nextMessages = [...conversation.messages];
  nextMessages[messageIndex] = message;

  return {
    ...conversation,
    messages: nextMessages,
  };
}

export const DirectMessageContainer = ({ activeUser, onOpenAuthModal }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(() =>
    consumeInitialConversation(conversationId),
  );
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadConversationRequestRef = useRef(0);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversation = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    const requestId = ++loadConversationRequestRef.current;

    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}`,
      );
      if (loadConversationRequestRef.current !== requestId) {
        return;
      }
      setConversation(data);
      setConversationError(null);
    } catch (error) {
      if (loadConversationRequestRef.current !== requestId) {
        return;
      }
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
        const message = await sendJSON<Models.DirectMessage>(`/api/v1/dm/${conversationId}/messages`, {
          body: params.body,
        });
        setConversation((currentConversation) =>
          upsertConversationMessage(currentConversation, message),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    return () => {
      if (typingRequestTimeoutRef.current !== null) {
        clearTimeout(typingRequestTimeoutRef.current);
      }
    };
  }, [conversationId]);

  const handleTyping = useCallback(() => {
    if (typingRequestTimeoutRef.current !== null) {
      clearTimeout(typingRequestTimeoutRef.current);
    }

    typingRequestTimeoutRef.current = setTimeout(() => {
      typingRequestTimeoutRef.current = null;
      void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
    }, TYPING_REQUEST_DEBOUNCE_MS);
  }, [conversationId]);

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      setConversation((currentConversation) =>
        upsertConversationMessage(currentConversation, event.payload),
      );
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
