import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import type { AuthStatus } from "@web-speed-hackathon-2026/client/src/auth/types";
import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import { fetchJSON, HTTPError, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

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
  authStatus: AuthStatus;
  authModalId: string;
  onSessionExpired: () => void;
}

export const DirectMessageContainer = ({
  activeUser,
  authStatus,
  authModalId,
  onSessionExpired,
}: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<Models.DirectMessageConversation | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRealtimeReady, setIsRealtimeReady] = useState(false);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestLoadRequestIdRef = useRef(0);
  const handleUnauthorized = useCallback(() => {
    latestLoadRequestIdRef.current += 1;
    setConversation(null);
    setConversationError(null);
    setIsPeerTyping(false);
    setIsRealtimeReady(false);
    if (peerTypingTimeoutRef.current !== null) {
      clearTimeout(peerTypingTimeoutRef.current);
      peerTypingTimeoutRef.current = null;
    }
    onSessionExpired();
  }, [onSessionExpired]);

  const loadConversation = useCallback(async () => {
    if (activeUser == null) {
      return null;
    }

    const requestId = latestLoadRequestIdRef.current + 1;
    latestLoadRequestIdRef.current = requestId;

    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}`,
      );
      if (requestId !== latestLoadRequestIdRef.current) {
        return null;
      }
      setConversation(data);
      setConversationError(null);
      return data;
    } catch (error) {
      if (requestId !== latestLoadRequestIdRef.current) {
        return null;
      }
      if (error instanceof HTTPError && error.status === 401) {
        handleUnauthorized();
        return null;
      }
      setConversation(null);
      setConversationError(error as Error);
      return null;
    }
  }, [activeUser, conversationId, handleUnauthorized]);

  const sendRead = useCallback(
    async (targetConversation: Models.DirectMessageConversation | null) => {
      if (activeUser == null || targetConversation == null) {
        return;
      }

      const hasUnreadPeerMessages = targetConversation.messages.some((message) => {
        return message.sender.id !== activeUser.id && !message.isRead;
      });
      if (!hasUnreadPeerMessages) {
        return;
      }

      try {
        await sendJSON(`/api/v1/dm/${conversationId}/read`, {});
      } catch (error) {
        if (error instanceof HTTPError && error.status === 401) {
          handleUnauthorized();
        }
      }
    },
    [activeUser, conversationId, handleUnauthorized],
  );

  // Synchronize the visible DM conversation with the server and mark unread peer messages as read.
  useEffect(() => {
    void loadConversation().then(async (nextConversation) => {
      await sendRead(nextConversation);
    });
  }, [loadConversation, sendRead]);

  const handleSubmit = useCallback(
    async (params: DirectMessageFormData) => {
      setIsSubmitting(true);
      try {
        await sendJSON(`/api/v1/dm/${conversationId}/messages`, {
          body: params.body,
        });
        const nextConversation = await loadConversation();
        await sendRead(nextConversation);
      } catch (error) {
        if (error instanceof HTTPError && error.status === 401) {
          handleUnauthorized();
        }
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId, handleUnauthorized, loadConversation, sendRead],
  );

  const handleTyping = useCallback(async () => {
    try {
      await sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
    } catch (error) {
      if (error instanceof HTTPError && error.status === 401) {
        handleUnauthorized();
      }
    }
  }, [conversationId, handleUnauthorized]);

  useWs(
    `/api/v1/dm/${conversationId}`,
    (event: DmUpdateEvent | DmTypingEvent) => {
      if (event.type === "dm:conversation:message") {
        void loadConversation().then(async (nextConversation) => {
          if (event.payload.sender.id !== activeUser?.id) {
            setIsPeerTyping(false);
            if (peerTypingTimeoutRef.current !== null) {
              clearTimeout(peerTypingTimeoutRef.current);
            }
            peerTypingTimeoutRef.current = null;
          }
          await sendRead(nextConversation);
        });
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
      onClose: () => {
        setIsRealtimeReady(false);
      },
      onOpen: () => {
        setIsRealtimeReady(true);
      },
    },
  );

  if (authStatus === "loading") {
    return (
      <Helmet>
        <title>読込中 - CaX</title>
      </Helmet>
    );
  }

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインしてください"
        authModalId={authModalId}
      />
    );
  }

  if (conversation == null) {
    if (conversationError instanceof HTTPError && conversationError.status === 404) {
      return <NotFoundContainer />;
    }
    if (conversationError != null) {
      return (
        <>
          <Helmet>
            <title>メッセージの取得に失敗しました - CaX</title>
          </Helmet>
          <section className="px-6 py-10">
            <p className="text-cax-danger text-sm">メッセージの取得に失敗しました</p>
          </section>
        </>
      );
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
        isRealtimeReady={isRealtimeReady}
        onTyping={handleTyping}
        isPeerTyping={isPeerTyping}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </>
  );
};
