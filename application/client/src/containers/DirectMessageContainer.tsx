import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/foundation/PageTitle";
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
interface DmReadEvent {
  type: "dm:conversation:read";
  payload: {};
}

const TYPING_INDICATOR_DURATION_MS = 10 * 1000;

function hasUnreadMessagesFromPeer(
  conversation: Models.DirectMessageConversation | null,
  activeUserId: string | undefined,
) {
  if (conversation == null || activeUserId == null) {
    return false;
  }

  return conversation.messages.some(
    (message) => message.sender.id !== activeUserId && !message.isRead,
  );
}

function markActiveUserMessagesAsRead(
  conversation: Models.DirectMessageConversation | null,
  activeUserId: string | undefined,
) {
  if (conversation == null || activeUserId == null) {
    return conversation;
  }

  let hasUpdates = false;
  const messages = conversation.messages.map((message) => {
    if (message.sender.id !== activeUserId || message.isRead) {
      return message;
    }

    hasUpdates = true;
    return { ...message, isRead: true };
  });

  return hasUpdates ? { ...conversation, messages } : conversation;
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
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationRef = useRef<Models.DirectMessageConversation | null>(null);
  const isSendingReadRef = useRef(false);
  const shouldRetryReadRef = useRef(false);

  const loadConversation = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}`,
      );
      startTransition(() => {
        setConversation(data);
        setConversationError(null);
      });
    } catch (error) {
      startTransition(() => {
        setConversation(null);
        setConversationError(error as Error);
      });
    }
  }, [activeUser, conversationId]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  const sendReadIfNeeded = useCallback(async () => {
    const currentConversation = conversationRef.current;
    const activeUserId = activeUser?.id;
    if (!hasUnreadMessagesFromPeer(currentConversation, activeUserId)) {
      return;
    }
    if (isSendingReadRef.current) {
      shouldRetryReadRef.current = true;
      return;
    }

    isSendingReadRef.current = true;
    try {
      await sendJSON(`/api/v1/dm/${conversationId}/read`, {});
    } finally {
      isSendingReadRef.current = false;
      if (shouldRetryReadRef.current) {
        shouldRetryReadRef.current = false;
        void sendReadIfNeeded();
      }
    }
  }, [activeUser?.id, conversationId]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    if (!hasUnreadMessagesFromPeer(conversation, activeUser?.id)) {
      return;
    }

    void sendReadIfNeeded();
  }, [activeUser?.id, conversation, sendReadIfNeeded]);

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
        startTransition(() => {
          setConversation((prev) => {
            if (prev == null) return prev;
            if (prev.messages.some((m) => m.id === newMessage.id)) return prev;
            return { ...prev, messages: [...prev.messages, newMessage] };
          });
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId],
  );

  const handleLoadOlderMessages = useCallback(async () => {
    setIsLoadingOlderMessages(true);
    try {
      const oldestMessageId = conversation?.messages[0]?.id;
      if (oldestMessageId == null) {
        return;
      }

      const olderConversation = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}?beforeMessageId=${encodeURIComponent(oldestMessageId)}`,
      );
      startTransition(() => {
        setConversation((prev) => {
          if (prev == null) {
            return prev;
          }

          const existingMessageIds = new Set(prev.messages.map((message) => message.id));
          const olderMessages = olderConversation.messages.filter(
            (message) => !existingMessageIds.has(message.id),
          );

          return {
            ...prev,
            hasOlderMessages: olderConversation.hasOlderMessages,
            messages: [...olderMessages, ...prev.messages],
          };
        });
      });
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [conversation, conversationId]);

  const lastTypingSentRef = useRef(0);
  const handleTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 3000) return;
    lastTypingSentRef.current = now;
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
  }, [conversationId]);

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent | DmReadEvent) => {
    if (event.type === "dm:conversation:message") {
      const newMsg = event.payload;
      startTransition(() => {
        setConversation((prev) => {
          if (prev == null) return prev;
          if (prev.messages.some((m) => m.id === newMsg.id)) return prev;
          return { ...prev, messages: [...prev.messages, newMsg] };
        });
      });
      if (newMsg.sender.id === activeUser?.id) {
        setIsSubmitting(false);
      } else {
        setIsPeerTyping(false);
        if (peerTypingTimeoutRef.current !== null) {
          clearTimeout(peerTypingTimeoutRef.current);
        }
        peerTypingTimeoutRef.current = null;
      }
    } else if (event.type === "dm:conversation:typing") {
      setIsPeerTyping(true);
      if (peerTypingTimeoutRef.current !== null) {
        clearTimeout(peerTypingTimeoutRef.current);
      }
      peerTypingTimeoutRef.current = setTimeout(() => {
        setIsPeerTyping(false);
      }, TYPING_INDICATOR_DURATION_MS);
    } else if (event.type === "dm:conversation:read") {
      startTransition(() => {
        setConversation((prev) => markActiveUserMessagesAsRead(prev, activeUser?.id));
      });
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
    return (
      <section className="bg-cax-surface flex min-h-[calc(100vh-(--spacing(12)))] flex-col lg:min-h-screen">
        <header className="border-cax-border bg-cax-surface sticky top-0 z-10 flex animate-pulse items-center gap-2 border-b px-4 py-3">
          <div className="bg-cax-border h-12 w-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="bg-cax-border h-4 w-1/3 rounded" />
            <div className="bg-cax-border h-3 w-1/4 rounded" />
          </div>
        </header>
        <div className="flex-1" />
      </section>
    );
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
        isLoadingOlderMessages={isLoadingOlderMessages}
        isSubmitting={isSubmitting}
        onLoadOlderMessages={handleLoadOlderMessages}
        onSubmit={handleSubmit}
      />
    </>
  );
};
