import { useCallback, useMemo, useState } from "react";

import { CrokGate } from "@web-speed-hackathon-2026/client/src/components/crok/CrokGate";
import { useDocumentTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_document_title";
import { CrokPage } from "@web-speed-hackathon-2026/client/src/components/crok/CrokPage";
import { useSSE } from "@web-speed-hackathon-2026/client/src/hooks/use_sse";

type Props = {
  activeUser: Models.User | null;
  authModalId: string;
};

export const CrokContainer = ({ activeUser, authModalId }: Props) => {
  const [messages, setMessages] = useState<Models.ChatMessage[]>([]);
  const [nextMessageId, setNextMessageId] = useState(0);

  const sseOptions = useMemo(
    () => ({
      onMessage: (data: Models.SSEChunk, prevContent: string) => {
        return prevContent + (data.text ?? "");
      },
      onDone: (data: Models.SSEChunk) => data.done === true,
      onComplete: (finalContent: string) => {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === "assistant") {
            return [...prev.slice(0, -1), { ...lastMessage, content: finalContent }];
          }
          return prev;
        });
      },
    }),
    [],
  );

  const { content, isStreaming, start } = useSSE<Models.SSEChunk>(sseOptions);

  const currentAssistantContent = isStreaming || content ? content : null;

  const displayMessages = useMemo(() => {
    if (currentAssistantContent !== null) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant") {
        return [
          ...messages.slice(0, -1),
          { role: "assistant" as const, content: currentAssistantContent },
        ];
      }
    }
    return messages;
  }, [messages, currentAssistantContent]);

  const sendMessage = useCallback(
    (userInput: string) => {
      if (!userInput.trim() || isStreaming) return;

      const userLocalId = `user:${nextMessageId}`;
      const assistantLocalId = `assistant:${nextMessageId + 1}`;
      const userMessage: Models.ChatMessage = {
        localId: userLocalId,
        role: "user",
        content: userInput,
      };
      const assistantMessage: Models.ChatMessage = {
        localId: assistantLocalId,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setNextMessageId((current) => current + 2);

      void import("@web-speed-hackathon-2026/client/src/components/crok/CrokMarkdownMessage");

      const encodedPrompt = encodeURIComponent(userInput);
      start(`/api/v1/crok?prompt=${encodedPrompt}`);
    },
    [isStreaming, nextMessageId, start],
  );

  useDocumentTitle("Crok - CaX");

  if (!activeUser) {
    return (
      <CrokGate headline="Crokを利用するにはサインインしてください" authModalId={authModalId} />
    );
  }

  return (
    <CrokPage isStreaming={isStreaming} messages={displayMessages} onSendMessage={sendMessage} />
  );
};
