import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";
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
  conversationId?: string;
}

export const DirectMessageContainer = ({ activeUser, authModalId, conversationId = "" }: Props) => {
  const ssrData = useContext(SSRDataContext);
  const ssrConversation = ssrData?.[`/api/v1/dm/${conversationId}`] as Models.DirectMessageConversation | undefined;
  const ssrMessages = ssrData?.[`/api/v1/dm/${conversationId}/messages`] as Models.DirectMessagePage | undefined;
  const hasSSRData = ssrConversation !== undefined && ssrMessages !== undefined;
  const skipInitialFetchRef = useRef(hasSSRData);

  const [conversationInfo, setConversationInfo] = useState<Models.DirectMessageConversation | null>(
    hasSSRData ? ssrConversation : null,
  );
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<Models.DirectMessage[]>(
    hasSSRData ? ssrMessages.messages : [],
  );
  const [hasMore, setHasMore] = useState(hasSSRData ? ssrMessages.hasMore : false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversationInfo = useCallback(async () => {
    if (activeUser == null) return;
    try {
      const data = await fetchJSON<Models.DirectMessageConversation>(
        `/api/v1/dm/${conversationId}`,
      );
      setConversationInfo(data);
      setConversationError(null);
    } catch (error) {
      setConversationInfo(null);
      setConversationError(error as Error);
    }
  }, [activeUser, conversationId]);

  const loadLatestMessages = useCallback(async () => {
    if (activeUser == null) return;
    setIsLoadingMessages(true);
    try {
      const data = await fetchJSON<Models.DirectMessagePage>(
        `/api/v1/dm/${conversationId}/messages?limit=20`,
      );
      setMessages(data.messages);
      setHasMore(data.hasMore);
    } catch {
      // conversation info error will handle display
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeUser, conversationId]);

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingMessages || !hasMore || messages.length === 0) return;
    const oldestId = messages[0]!.id;
    setIsLoadingMessages(true);
    try {
      const data = await fetchJSON<Models.DirectMessagePage>(
        `/api/v1/dm/${conversationId}/messages?limit=20&before=${oldestId}`,
      );
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [isLoadingMessages, hasMore, messages, conversationId]);

  const sendRead = useCallback(async () => {
    await sendJSON(`/api/v1/dm/${conversationId}/read`, {});
  }, [conversationId]);

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      // Still mark messages as read
      void sendRead();
      return;
    }
    void loadConversationInfo();
    void loadLatestMessages();
    void sendRead();
  }, [loadConversationInfo, loadLatestMessages, sendRead]);

  const handleSubmit = useCallback(
    async (params: DirectMessageFormData) => {
      setIsSubmitting(true);
      try {
        const newMessage = await sendJSON<Models.DirectMessage>(`/api/v1/dm/${conversationId}/messages`, {
          body: params.body,
        });
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId],
  );

  const handleTyping = useCallback(async () => {
    void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
  }, [conversationId]);

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      const newMessage = event.payload;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      if (newMessage.sender.id !== activeUser?.id) {
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

  const peer = conversationInfo
    ? (conversationInfo.initiator.id !== activeUser?.id ? conversationInfo.initiator : conversationInfo.member)
    : null;

  useTitle(peer ? `${peer.name} さんとのダイレクトメッセージ - CaX` : "ダイレクトメッセージ - CaX");

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインしてください"
        authModalId={authModalId}
      />
    );
  }

  if (conversationInfo == null) {
    if (conversationError != null) {
      return <NotFoundContainer />;
    }
    return (
      <div className="flex justify-center py-12">
        <span className="text-cax-text-muted animate-spin text-2xl">
          <FontAwesomeIcon iconType="circle-notch" styleType="solid" />
        </span>
      </div>
    );
  }

  return (
    <DirectMessagePage
      conversationInfo={conversationInfo}
      messages={messages}
      hasMore={hasMore}
      isLoadingMessages={isLoadingMessages}
      onLoadOlderMessages={loadOlderMessages}
      conversationError={conversationError}
      activeUser={activeUser}
      onTyping={handleTyping}
      isPeerTyping={isPeerTyping}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
};
