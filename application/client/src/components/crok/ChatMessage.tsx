import { lazy, Suspense } from "react";

import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

const LazyMarkdownRenderer = lazy(() =>
  Promise.all([
    import("katex/dist/katex.min.css" as string),
    import("react-markdown"),
    import("rehype-katex"),
    import("remark-gfm"),
    import("remark-math"),
    import("@web-speed-hackathon-2026/client/src/components/crok/CodeBlock"),
  ]).then(([_, reactMarkdown, rehypeKatex, remarkGfm, remarkMath, codeBlock]) => ({
    default: ({ content }: { content: string }) => {
      const Markdown = reactMarkdown.default;
      return (
        <Markdown
          components={{ pre: codeBlock.CodeBlock }}
          key={content}
          rehypePlugins={[rehypeKatex.default]}
          remarkPlugins={[remarkMath.default, remarkGfm.default]}
        >
          {content}
        </Markdown>
      );
    },
  })),
);

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
            <Suspense fallback={<TypingIndicator />}>
              <LazyMarkdownRenderer content={content} />
            </Suspense>
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
