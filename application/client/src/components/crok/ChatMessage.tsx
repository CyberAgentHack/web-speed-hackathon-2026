import { memo } from "react";

import { CrokMarkdownMessage } from "@web-speed-hackathon-2026/client/src/components/crok/CrokMarkdownMessage";
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

interface Props {
  message: Models.ChatMessage;
  isStreaming?: boolean;
}

const UserMessage = ({ content }: { content: string }) => {
  return (
    <div className="mb-6 flex justify-end">
      <div className="bg-cax-surface-subtle text-cax-text max-w-[80%] rounded-3xl px-4 py-2">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

const AssistantMessage = ({
  content,
  isStreaming = false,
}: {
  content: string;
  isStreaming?: boolean;
}) => {
  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {!content ? (
            <TypingIndicator />
          ) : isStreaming ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <CrokMarkdownMessage content={content} />
          )}
        </div>
      </div>
    </div>
  );
};

const ChatMessageInner = ({ message, isStreaming }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return <AssistantMessage content={message.content} isStreaming={isStreaming} />;
};

export const ChatMessage = memo(ChatMessageInner);
