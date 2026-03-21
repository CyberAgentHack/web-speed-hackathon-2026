import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
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
const TYPING_EVENT_THROTTLE_MS = TYPING_INDICATOR_DURATION_MS;
const INITIAL_CONVERSATION_RETRY_COUNT = 5;
const INITIAL_CONVERSATION_RETRY_DELAY_MS = 200;
const SELF_MESSAGE_SYNC_DELAY_MS = 1_000;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
  const selfMessageSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAtRef = useRef(0);
  const hasLoadedConversationRef = useRef(false);

  const loadConversation = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    const maxAttempts = hasLoadedConversationRef.current ? 1 : INITIAL_CONVERSATION_RETRY_COUNT;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const data = await fetchJSON<Models.DirectMessageConversation>(
          `/api/v1/dm/${conversationId}`,
        );
        hasLoadedConversationRef.current = true;
        setConversation(data);
        setConversationError(null);
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          setConversation(null);
          setConversationError(error as Error);
          return;
        }

        await sleep(INITIAL_CONVERSATION_RETRY_DELAY_MS);
      }
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
      const optimisticId = activeUser == null ? null : crypto.randomUUID();

      startTransition(() => {
        setIsSubmitting(true);

        if (activeUser != null) {
          setConversation((prev) => {
            if (prev == null) return prev;
            return {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: optimisticId!,
                  conversationId,
                  senderId: activeUser.id,
                  body: params.body,
                  isRead: false,
                  sender: activeUser,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as Models.DirectMessage,
              ],
            };
          });
        }
      });

      try {
        await sendJSON(`/api/v1/dm/${conversationId}/messages`, {
          body: params.body,
        });
      } catch (error) {
        if (optimisticId != null) {
          startTransition(() => {
            setConversation((prev) => {
              if (prev == null) return prev;
              return {
                ...prev,
                messages: prev.messages.filter((message) => message.id !== optimisticId),
              };
            });
          });
        }
        throw error;
      } finally {
        startTransition(() => {
          setIsSubmitting(false);
        });
      }
    },
    [conversationId, loadConversation, activeUser],
  );

  const handleTyping = useCallback(async () => {
    const now = Date.now();
    if (now - lastTypingSentAtRef.current < TYPING_EVENT_THROTTLE_MS) {
      return;
    }

    lastTypingSentAtRef.current = now;
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
  }, [conversationId]);

  useEffect(() => {
    lastTypingSentAtRef.current = 0;
    hasLoadedConversationRef.current = false;
    if (selfMessageSyncTimeoutRef.current !== null) {
      clearTimeout(selfMessageSyncTimeoutRef.current);
      selfMessageSyncTimeoutRef.current = null;
    }
    setConversation(null);
    setConversationError(null);
  }, [conversationId]);

  useWs(
    `/api/v1/dm/${conversationId}`,
    (event: DmUpdateEvent | DmTypingEvent) => {
      if (event.type === "dm:conversation:message") {
        if (event.payload.sender.id === activeUser?.id) {
          if (selfMessageSyncTimeoutRef.current !== null) {
            clearTimeout(selfMessageSyncTimeoutRef.current);
          }
          selfMessageSyncTimeoutRef.current = setTimeout(() => {
            selfMessageSyncTimeoutRef.current = null;
            void loadConversation();
          }, SELF_MESSAGE_SYNC_DELAY_MS);
          return;
        }

        void loadConversation().then(() => {
          setIsPeerTyping(false);
          if (peerTypingTimeoutRef.current !== null) {
            clearTimeout(peerTypingTimeoutRef.current);
          }
          peerTypingTimeoutRef.current = null;
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
    {
      onOpen: () => {
        void loadConversation();
        void sendRead();
      },
    },
  );

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインしてください"
        authModalId={authModalId}
      />
    );
  }

  const peer =
    conversation == null
      ? null
      : conversation.initiator.id !== activeUser?.id
        ? conversation.initiator
        : conversation.member;

  return (
    <>
      <Helmet>
        <title>
          {peer == null ? "ダイレクトメッセージ - CaX" : `${peer.name} さんとのダイレクトメッセージ - CaX`}
        </title>
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
