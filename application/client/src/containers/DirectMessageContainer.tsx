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
const TYPING_NOTIFY_THROTTLE_MS = 500;

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

function upsertConversationMessage(
  conversation: Models.DirectMessageConversation,
  message: Models.DirectMessage,
): Models.DirectMessageConversation {
  const existingIndex = conversation.messages.findIndex((current) => current.id === message.id);
  const nextMessages =
    existingIndex >= 0
      ? conversation.messages.map((current) => (current.id === message.id ? message : current))
      : [...conversation.messages, message];

  nextMessages.sort((left, right) => {
    const createdAtComparison = left.createdAt.localeCompare(right.createdAt);
    if (createdAtComparison !== 0) {
      return createdAtComparison;
    }
    return left.id.localeCompare(right.id);
  });

  return {
    ...conversation,
    messages: nextMessages,
  };
}

export const DirectMessageContainer = ({ activeUser, authModalId }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousScrollHeightBeforePrepend, setPreviousScrollHeightBeforePrepend] = useState(0);
  const [preserveScrollOnPrependToken, setPreserveScrollOnPrependToken] = useState(0);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingNotifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingNotifyAtRef = useRef(0);

  const loadConversation = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}`,
        { cache: "no-store" },
      );
      setConversation(data);
      setConversationError(null);
    } catch (error) {
      setConversation(null);
      setConversationError(error as Error);
    }
  }, [activeUser, conversationId]);

  const fetchOlderMessages = useCallback(async () => {
    if (conversation == null || conversation.messages.length === 0 || isFetchingOlder) {
      return;
    }

    const oldestMessage = conversation.messages[0];
    if (oldestMessage == null) {
      return;
    }

    setIsFetchingOlder(true);
    try {
      const messageList = document.querySelector<HTMLElement>("[data-testid='dm-message-list']")
        ?.parentElement;
      const previousScrollHeight = messageList?.scrollHeight ?? 0;
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}?before=${encodeURIComponent(oldestMessage.createdAt)}`,
        { cache: "no-store" },
      );
      setConversation((current) => {
        if (current == null) {
          return data;
        }

        return {
          ...current,
          hasOlderMessages: data.hasOlderMessages,
          messages: [...data.messages, ...current.messages],
        };
      });
      setPreviousScrollHeightBeforePrepend(previousScrollHeight);
      setPreserveScrollOnPrependToken((current) => current + 1);
      setConversationError(null);
    } catch (error) {
      setConversationError(error as Error);
    } finally {
      setIsFetchingOlder(false);
    }
  }, [conversation, conversationId, isFetchingOlder]);

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
        setConversation((current) => {
          if (current == null) {
            return current;
          }

          return upsertConversationMessage(current, message);
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId],
  );

  const handleTyping = useCallback(() => {
    const now = Date.now();
    const elapsedMs = now - lastTypingNotifyAtRef.current;

    if (elapsedMs >= TYPING_NOTIFY_THROTTLE_MS) {
      lastTypingNotifyAtRef.current = now;
      void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
      return;
    }

    if (typingNotifyTimeoutRef.current != null) {
      return;
    }

    typingNotifyTimeoutRef.current = setTimeout(() => {
      lastTypingNotifyAtRef.current = Date.now();
      typingNotifyTimeoutRef.current = null;
      void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
    }, TYPING_NOTIFY_THROTTLE_MS - elapsedMs);
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (peerTypingTimeoutRef.current != null) {
        clearTimeout(peerTypingTimeoutRef.current);
      }
      if (typingNotifyTimeoutRef.current != null) {
        clearTimeout(typingNotifyTimeoutRef.current);
      }
    };
  }, []);

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      setConversation((current) => {
        if (current == null) {
          return current;
        }

        return upsertConversationMessage(current, event.payload);
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
        isFetchingOlder={isFetchingOlder}
        previousScrollHeightBeforePrepend={previousScrollHeightBeforePrepend}
        preserveScrollOnPrependToken={preserveScrollOnPrependToken}
        onTyping={handleTyping}
        isPeerTyping={isPeerTyping}
        isSubmitting={isSubmitting}
        onFetchOlder={fetchOlderMessages}
        onSubmit={handleSubmit}
      />
    </>
  );
};
