import { lazy, memo, Suspense } from "react";

import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

const MarkdownRenderer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/crok/CrokMarkdownMessage").then((m) => ({
    default: m.CrokMarkdownMessage,
  })),
);

interface Props {
  message: Models.ChatMessage;
  renderMarkdown?: boolean;
}

const UserMessage = memo(({ content }: { content: string }) => {
  return (
    <div className="mb-6 flex justify-end">
      <div className="bg-cax-surface-subtle text-cax-text max-w-[80%] rounded-3xl px-4 py-2">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
});
UserMessage.displayName = "UserMessage";

const PlainTextContent = ({ content }: { content: string }) => (
  <p className="whitespace-pre-wrap">{content}</p>
);

const AssistantMessage = memo(({ content, renderMarkdown = true }: { content: string; renderMarkdown?: boolean }) => {
  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {content ? (
            renderMarkdown ? (
              <Suspense fallback={<PlainTextContent content={content} />}>
                <MarkdownRenderer content={content} />
              </Suspense>
            ) : (
              <PlainTextContent content={content} />
            )
          ) : (
            <TypingIndicator />
          )}
        </div>
      </div>
    </div>
  );
});
AssistantMessage.displayName = "AssistantMessage";

export const ChatMessage = ({ message, renderMarkdown = true }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return <AssistantMessage content={message.content} renderMarkdown={renderMarkdown} />;
};
