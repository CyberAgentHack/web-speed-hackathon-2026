import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import {
  fetchJSON,
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
const MESSAGES_LIMIT = 20;

interface ConversationMeta {
  id: string;
  initiator: Models.User;
  member: Models.User;
}

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageContainer = ({ activeUser, authModalId }: Props) => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();

  const [conversationMeta, setConversationMeta] =
    useState<ConversationMeta | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(
    null,
  );
  const [messages, setMessages] = useState<Models.DirectMessage[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // サーバーから取得済みの件数（WS 追加分は含まない）
  const serverOffsetRef = useRef(0);
  // scrollTrigger が増えると Page が最下部にスクロールする
  const [scrollTrigger, setScrollTrigger] = useState(0);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const hasMore = messages.length < totalMessages;

  const loadConversation = useCallback(async () => {
    if (activeUser === null) {
      return;
    }

    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}?limit=${MESSAGES_LIMIT}&offset=0`,
      );
      const { messages: msgs, totalMessages: total, ...meta } = data;
      setConversationMeta(meta);
      setMessages(msgs);
      setTotalMessages(total);
      serverOffsetRef.current = msgs.length;
      setConversationError(null);
      setScrollTrigger((t) => t + 1);
    } catch (error) {
      setConversationMeta(null);
      setConversationError(error as Error);
    }
  }, [activeUser, conversationId]);

  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}?limit=${MESSAGES_LIMIT}&offset=${serverOffsetRef.current}`,
      );
      setMessages((prev) => [...data.messages, ...prev]);
      setTotalMessages(data.totalMessages);
      serverOffsetRef.current += data.messages.length;
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, isLoadingMore]);

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
        await sendJSON(`/api/v1/dm/${conversationId}/messages`, { body: params.body });
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId],
  );

  const handleTyping = useCallback(async () => {
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
  }, [conversationId]);

  useWs(
    `/api/v1/dm/${conversationId}`,
    (event: DmUpdateEvent | DmTypingEvent) => {
      if (event.type === "dm:conversation:message") {
        setMessages((prev) => [...prev, event.payload]);
        setTotalMessages((t) => t + 1);
        setScrollTrigger((t) => t + 1);
        setIsPeerTyping(false);
        if (peerTypingTimeoutRef.current !== null) {
          clearTimeout(peerTypingTimeoutRef.current);
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
    }
  );

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインしてください"
        authModalId={authModalId}
      />
    );
  }

  if (conversationMeta == null) {
    if (conversationError != null) {
      return <NotFoundContainer />;
    }
    return null;
  }

  const peer =
    conversationMeta.initiator.id !== activeUser?.id
      ? conversationMeta.initiator
      : conversationMeta.member;

  return (
    <>
      <Helmet>
        <title>{peer.name} さんとのダイレクトメッセージ - CaX</title>
      </Helmet>
      <DirectMessagePage
        conversationError={conversationError}
        conversationMeta={conversationMeta}
        messages={messages}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMoreMessages}
        scrollTrigger={scrollTrigger}
        activeUser={activeUser}
        onTyping={handleTyping}
        isPeerTyping={isPeerTyping}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </>
  );
};
