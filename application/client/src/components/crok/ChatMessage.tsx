import { ComponentProps, Suspense, lazy } from "react";
import "katex/dist/katex.min.css";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

const LazyCodeBlock = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/components/crok/CodeBlock");
  return { default: module.CodeBlock };
});

const CodeBlockFallback = ({ children }: ComponentProps<"pre">) => {
  return (
    <pre
      className="border-cax-border bg-cax-surface-subtle overflow-x-auto rounded-lg border px-4 py-6 text-sm"
      style={{ fontSize: "14px" }}
    >
      {children}
    </pre>
  );
};

const MarkdownCodeBlock = (props: ComponentProps<"pre">) => {
  return (
    <Suspense fallback={<CodeBlockFallback {...props} />}>
      <LazyCodeBlock {...props} />
    </Suspense>
  );
};

interface Props {
  message: Models.ChatMessage;
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

const AssistantMessage = ({ content }: { content: string }) => {
  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {content ? (
            <Markdown
              components={{ pre: MarkdownCodeBlock }}
              key={content}
              rehypePlugins={[rehypeKatex]}
              remarkPlugins={[remarkMath, remarkGfm]}
            >
              {content}
            </Markdown>
          ) : (
            <TypingIndicator />
          )}
        </div>
      </div>
    </div>
  );
};

export const ChatMessage = ({ message }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return <AssistantMessage content={message.content} />;
};
