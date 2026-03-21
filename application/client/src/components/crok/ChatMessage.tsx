import { ComponentType, useEffect, useState } from "react";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

interface Props {
  message: Models.ChatMessage;
}

interface MarkdownState {
  Markdown: null | ComponentType<any>;
  rehypeKatex: unknown;
  remarkGfm: unknown;
  remarkMath: unknown;
}

const renderPlainMarkdownLike = (content: string) => {
  return content.split("\n").map((line, index) => {
    if (line.startsWith("### ")) {
      return (
        <h3 key={index} className="text-xl font-bold">
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={index} className="text-2xl font-bold">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("# ")) {
      return (
        <h1 key={index} className="text-3xl font-bold">
          {line.slice(2)}
        </h1>
      );
    }

    return (
      <p key={index} className="whitespace-pre-wrap">
        {line}
      </p>
    );
  });
};

const MarkdownRenderer = ({ content }: { content: string }) => {
  const [{ Markdown, rehypeKatex, remarkGfm, remarkMath }, setMarkdown] = useState<MarkdownState>({
    Markdown: null,
    rehypeKatex: null,
    remarkGfm: null,
    remarkMath: null,
  });

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      import("katex/dist/katex.min.css"),
      import("react-markdown"),
      import("rehype-katex"),
      import("remark-gfm"),
      import("remark-math"),
    ]).then(([, markdownModule, rehypeKatexModule, remarkGfmModule, remarkMathModule]) => {
      if (cancelled) {
        return;
      }

      setMarkdown({
        Markdown: markdownModule.default,
        rehypeKatex: rehypeKatexModule.default,
        remarkGfm: remarkGfmModule.default,
        remarkMath: remarkMathModule.default,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (Markdown == null) {
    return <>{renderPlainMarkdownLike(content)}</>;
  }

  return (
    <Markdown
      components={{ pre: CodeBlock }}
      key={content}
      rehypePlugins={[rehypeKatex as any]}
      remarkPlugins={[remarkMath as any, remarkGfm as any]}
    >
      {content}
    </Markdown>
  );
};

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
            <MarkdownRenderer content={content} />
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
