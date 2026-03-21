import { useEffect, useRef, type RefObject } from "react";

import "katex/dist/katex.min.css";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

interface Props {
  message: Models.ChatMessage;
  streaming: boolean;
  streamingContentRef: RefObject<string>;
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
  streaming,
  streamingContentRef,
}: {
  content: string;
  streaming: boolean;
  streamingContentRef: RefObject<string>;
}) => {
  const streamingTextRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!streaming) return;

    const interval = window.setInterval(() => {
      if (streamingTextRef.current) {
        streamingTextRef.current.textContent = streamingContentRef.current;
      }
    }, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [streaming, streamingContentRef]);

  useEffect(() => {
    if (streaming) return;
    if (streamingTextRef.current) {
      streamingTextRef.current.textContent = content;
    }
  }, [content, streaming]);

  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {streaming ? (
            <pre ref={streamingTextRef} className="whitespace-pre-wrap">
              {content}
            </pre>
          ) : content ? (
            <Markdown
              components={{ pre: CodeBlock }}
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

export const ChatMessage = ({ message, streaming, streamingContentRef }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return (
    <AssistantMessage
      content={message.content}
      streaming={streaming}
      streamingContentRef={streamingContentRef}
    />
  );
};
