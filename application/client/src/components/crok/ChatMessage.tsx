import { memo, Suspense } from "react";

import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";
import { lazyNamed } from "@web-speed-hackathon-2026/client/src/utils/lazy";

interface Props {
  message: Models.ChatMessage;
  streaming?: boolean;
}

const loadChatMarkdown = () =>
  import(
    /* webpackChunkName: "feature-crok-markdown" */ "@web-speed-hackathon-2026/client/src/components/crok/ChatMarkdown"
  );

const ChatMarkdownLazy = lazyNamed(loadChatMarkdown, "ChatMarkdown");

export function preloadChatMarkdown() {
  void loadChatMarkdown();
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

const AssistantMessage = ({ content, streaming = false }: { content: string; streaming?: boolean }) => {
  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {content && !streaming ? (
            <Suspense fallback={<p className="whitespace-pre-wrap">{content}</p>}>
              <ChatMarkdownLazy content={content} />
            </Suspense>
          ) : content ? (
            <>
              <div aria-label="応答中" className="sr-only" role="status">
                応答中
              </div>
              <p className="whitespace-pre-wrap">{content}</p>
            </>
          ) : (
            <TypingIndicator />
          )}
        </div>
      </div>
    </div>
  );
};

export const ChatMessage = memo(({ message, streaming = false }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return <AssistantMessage content={message.content} streaming={streaming} />;
});
