import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/application/PageTitle";
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
const TYPING_SIGNAL_THROTTLE_MS = 1500;

function mergeConversationMessage(
  conversation: Models.DirectMessageConversation | null,
  message: Models.DirectMessage,
): Models.DirectMessageConversation | null {
  if (conversation == null) {
    return conversation;
  }

  const existingIndex = conversation.messages.findIndex(({ id }) => id === message.id);
  let nextMessages = conversation.messages;

  if (existingIndex !== -1) {
    nextMessages = conversation.messages.map((currentMessage, index) =>
      index === existingIndex
        ? {
            ...currentMessage,
            ...message,
          }
        : currentMessage,
    );
  } else if (conversation.messages.length === 0) {
    nextMessages = [message];
  } else {
    const nextCreatedAt = new Date(message.createdAt).getTime();
    const firstCreatedAt = new Date(conversation.messages[0]!.createdAt).getTime();
    const lastCreatedAt = new Date(
      conversation.messages[conversation.messages.length - 1]!.createdAt,
    ).getTime();

    if (nextCreatedAt <= firstCreatedAt) {
      nextMessages = [message, ...conversation.messages];
    } else if (nextCreatedAt >= lastCreatedAt) {
      nextMessages = [...conversation.messages, message];
    } else {
      const insertIndex = conversation.messages.findIndex(
        (currentMessage) => new Date(currentMessage.createdAt).getTime() > nextCreatedAt,
      );

      nextMessages = [
        ...conversation.messages.slice(0, insertIndex),
        message,
        ...conversation.messages.slice(insertIndex),
      ];
    }
  }

  return {
    ...conversation,
    messages: nextMessages,
  };
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
  const typingSignalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSignalAtRef = useRef(0);

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
      if (activeUser == null) {
        return;
      }

      setIsSubmitting(true);

      try {
        const message = await sendJSON<Models.DirectMessage>(`/api/v1/dm/${conversationId}/messages`, {
          body: params.body,
        });
        setConversation((currentConversation) =>
          mergeConversationMessage(currentConversation, message),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeUser, conversationId],
  );

  const sendTypingSignal = useCallback(() => {
    lastTypingSignalAtRef.current = Date.now();
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
  }, [conversationId]);

  const handleTyping = useCallback(
    (text: string) => {
      if (text.trim().length === 0) {
        if (typingSignalTimeoutRef.current !== null) {
          clearTimeout(typingSignalTimeoutRef.current);
          typingSignalTimeoutRef.current = null;
        }
        return;
      }

      const elapsedMs = Date.now() - lastTypingSignalAtRef.current;
      if (elapsedMs >= TYPING_SIGNAL_THROTTLE_MS) {
        if (typingSignalTimeoutRef.current !== null) {
          clearTimeout(typingSignalTimeoutRef.current);
          typingSignalTimeoutRef.current = null;
        }
        sendTypingSignal();
        return;
      }

      if (typingSignalTimeoutRef.current !== null) {
        return;
      }

      const waitMs = TYPING_SIGNAL_THROTTLE_MS - elapsedMs;
      typingSignalTimeoutRef.current = setTimeout(() => {
        typingSignalTimeoutRef.current = null;
        sendTypingSignal();
      }, waitMs);
    },
    [sendTypingSignal],
  );

  useEffect(() => {
    return () => {
      if (typingSignalTimeoutRef.current !== null) {
        clearTimeout(typingSignalTimeoutRef.current);
        typingSignalTimeoutRef.current = null;
      }
      lastTypingSignalAtRef.current = 0;
    };
  }, [conversationId]);

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      setConversation((currentConversation) => {
        if (currentConversation == null) {
          return currentConversation;
        }

        const alreadyHasMessage = currentConversation.messages.some(
          (message) => message.id === event.payload.id,
        );

        // Own outgoing message will be reflected by POST response.
        // Skip initial own WS echo so "sent" timing matches submit completion.
        if (event.payload.sender.id === activeUser?.id && !alreadyHasMessage) {
          return currentConversation;
        }

        return mergeConversationMessage(currentConversation, event.payload);
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
      <PageTitle title={`${peer.name} さんとのダイレクトメッセージ - CaX`} />
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
