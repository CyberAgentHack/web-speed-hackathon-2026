import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/foundation/PageTitle";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import { consumePrefetchJSON, fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface DmUpdateEvent {
  type: "dm:conversation:message";
  payload: Models.DirectMessage;
}
interface DmTypingEvent {
  type: "dm:conversation:typing";
  payload: {};
}

const TYPING_INDICATOR_DURATION_MS = 10 * 1000;
const TYPING_EVENT_THROTTLE_MS = 1000;
const TYPING_EVENT_DEBOUNCE_MS = 250;

function upsertConversationMessage(
  current: Models.DirectMessageConversation,
  nextMessage: Models.DirectMessage,
): Models.DirectMessageConversation {
  const existingIndex = current.messages.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex >= 0) {
    const nextMessages = current.messages.slice();
    nextMessages[existingIndex] = nextMessage;

    return {
      ...current,
      messages: nextMessages,
    };
  }

  const lastMessage = current.messages.at(-1);
  if (
    lastMessage == null ||
    new Date(lastMessage.createdAt).getTime() <= new Date(nextMessage.createdAt).getTime()
  ) {
    return {
      ...current,
      messages: [...current.messages, nextMessage],
    };
  }

  const insertIndex = current.messages.findIndex(
    (message) => new Date(message.createdAt).getTime() > new Date(nextMessage.createdAt).getTime(),
  );
  const nextMessages = current.messages.slice();
  nextMessages.splice(insertIndex, 0, nextMessage);

  return {
    ...current,
    messages: nextMessages,
  };
}

function removeConversationMessage(
  current: Models.DirectMessageConversation,
  messageId: string,
): Models.DirectMessageConversation {
  return {
    ...current,
    messages: current.messages.filter((message) => message.id !== messageId),
  };
}

function replaceConversationMessage(
  current: Models.DirectMessageConversation,
  optimisticMessageId: string,
  nextMessage: Models.DirectMessage,
): Models.DirectMessageConversation {
  return upsertConversationMessage(removeConversationMessage(current, optimisticMessageId), nextMessage);
}

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
  const typingRequestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAtRef = useRef(0);
  const optimisticMessageIdRef = useRef(0);

  const loadConversation = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    try {
      const apiPath = `/api/v1/dm/${conversationId}`;
      const prefetched = consumePrefetchJSON<Models.DirectMessageConversation>(apiPath);
      const data = prefetched ? await prefetched : await fetchJSON<Models.DirectMessageConversation>(apiPath);
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
  }, [loadConversation]);

  useEffect(() => {
    if (activeUser == null || conversation == null) {
      return;
    }

    const hasUnreadPeerMessage = conversation.messages.some(
      (message) => !message.isRead && message.sender.id !== activeUser.id,
    );
    if (!hasUnreadPeerMessage) {
      return;
    }

    void sendRead();
  }, [activeUser, conversation, sendRead]);

  const handleSubmit = useCallback(
    async (params: DirectMessageFormData) => {
      if (activeUser == null) {
        return;
      }

      const body = params.body.trim();
      if (body.length === 0) {
        return;
      }

      const createdAt = new Date().toISOString();
      const optimisticMessageId = `optimistic:${conversationId}:${optimisticMessageIdRef.current++}`;
      const optimisticMessage: Models.DirectMessage = {
        body,
        createdAt,
        id: optimisticMessageId,
        isRead: false,
        sender: activeUser,
        updatedAt: createdAt,
      };

      setConversation((current) =>
        current === null ? current : upsertConversationMessage(current, optimisticMessage),
      );

      try {
        const message = await sendJSON<Models.DirectMessage>(`/api/v1/dm/${conversationId}/messages`, {
          body,
        });
        setConversation((current) =>
          current === null
            ? current
            : replaceConversationMessage(current, optimisticMessageId, message),
        );
      } catch (error) {
        setConversation((current) =>
          current === null ? current : removeConversationMessage(current, optimisticMessageId),
        );
        throw error;
      }
    },
    [activeUser, conversationId],
  );

  const handleTyping = useCallback(() => {
    if (typingRequestTimeoutRef.current !== null) {
      clearTimeout(typingRequestTimeoutRef.current);
    }

    typingRequestTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastTypingSentAtRef.current < TYPING_EVENT_THROTTLE_MS) {
        return;
      }
      lastTypingSentAtRef.current = now;
      void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
    }, TYPING_EVENT_DEBOUNCE_MS);
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (peerTypingTimeoutRef.current !== null) {
        clearTimeout(peerTypingTimeoutRef.current);
      }
      if (typingRequestTimeoutRef.current !== null) {
        clearTimeout(typingRequestTimeoutRef.current);
      }
    };
  }, []);

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      setConversation((current) =>
        current === null ? current : upsertConversationMessage(current, event.payload),
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
        authModalId={authModalId}
      />
    );
  }

  if (conversation == null) {
    if (conversationError != null) {
      return <NotFoundContainer />;
    }
    return (
      <>
        <PageTitle title="ダイレクトメッセージ - CaX" />
        <section className="bg-cax-surface flex min-h-[calc(100vh-(--spacing(12)))] flex-col lg:min-h-screen">
          <header className="border-cax-border bg-cax-surface sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3">
            <div className="bg-cax-surface-subtle h-12 w-12 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="bg-cax-surface-subtle h-5 w-32 rounded" />
              <div className="bg-cax-surface-subtle h-3 w-24 rounded" />
            </div>
          </header>
          <div className="bg-cax-surface-subtle flex flex-1 items-center justify-center px-4 py-8">
            <p className="text-cax-text-muted text-sm">メッセージを読み込んでいます...</p>
          </div>
          <div className="border-cax-border bg-cax-surface border-t p-4">
            <div className="bg-cax-surface-subtle h-11 rounded-xl" />
          </div>
        </section>
      </>
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
        onSubmit={handleSubmit}
      />
    </>
  );
};
