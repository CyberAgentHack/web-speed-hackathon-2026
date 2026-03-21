import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import useSWR from "swr";

import { apiClient } from "@web-speed-hackathon-2026/client/src/api/client";
import { swrFetcher } from "@web-speed-hackathon-2026/client/src/api/swr";
import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";

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

  const {
    data: conversation,
    error: conversationError,
    mutate: mutateConversation,
  } = useSWR<Models.DirectMessageConversation | null, Error, string | null>(
    activeUser != null ? `/api/v1/dm/${conversationId}` : null,
    swrFetcher,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendRead = useCallback(async () => {
    await apiClient.dm[":conversationId"].read.$post({
      param: { conversationId },
    });
  }, [conversationId]);

  const handleSubmit = useCallback(
    async (params: DirectMessageFormData) => {
      setIsSubmitting(true);
      try {
        await apiClient.dm[":conversationId"].messages.$post({
          param: { conversationId },
          json: { body: params.body },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        void mutateConversation();
      } finally {
        setIsSubmitting(false);
      }
    },
    [conversationId, mutateConversation],
  );

  const handleTyping = useCallback(async () => {
    void apiClient.dm[":conversationId"].typing.$post({
      param: { conversationId },
    });
  }, [conversationId]);

  useWs(`/api/v1/dm/${conversationId}`, (event: DmUpdateEvent | DmTypingEvent) => {
    if (event.type === "dm:conversation:message") {
      void mutateConversation().then(() => {
        if (event.payload.sender.id !== activeUser?.id) {
          setIsPeerTyping(false);
          if (peerTypingTimeoutRef.current !== null) {
            clearTimeout(peerTypingTimeoutRef.current);
          }
          peerTypingTimeoutRef.current = null;
        }
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
  });

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインしてください"
        authModalId={authModalId}
      />
    );
  }

  const peer =
    conversation != null
      ? conversation.initiator.id !== activeUser?.id
        ? conversation.initiator
        : conversation.member
      : null;

  useEffect(() => {
    if (peer != null) {
      document.title = `${peer.name} さんとのダイレクトメッセージ - CaX`;
    }
  }, [peer]);

  if (conversation == null) {
    if (conversationError != null) {
      return <NotFoundContainer />;
    }
    return null;
  }

  return (
    <DirectMessagePage
      conversationError={conversationError ?? null}
      conversation={conversation}
      activeUser={activeUser}
      onTyping={handleTyping}
      isPeerTyping={isPeerTyping}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
};
