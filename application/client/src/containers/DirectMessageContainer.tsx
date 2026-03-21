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

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

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
      setIsSubmitting(true);
      try {
        const newMessage = await sendJSON<Models.DirectMessage>(
          `/api/v1/dm/${conversationId}/messages`,
          {
            body: params.body,
          },
        );
        setConversation((prev) => {
          if (prev == null) return prev;
          if (prev.messages.some((m) => m.id === newMessage.id)) return prev;
          return { ...prev, messages: [...prev.messages, newMessage] };
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

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      const newMsg = event.payload;
      setConversation((prev) => {
        if (prev == null) return prev;
        if (prev.messages.some((m) => m.id === newMsg.id)) return prev;
        return { ...prev, messages: [...prev.messages, newMsg] };
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
      <Helmet>
        <title>{peer.name} さんとのダイレクトメッセージ - CaX</title>
      </Helmet>
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
