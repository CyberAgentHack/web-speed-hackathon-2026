import "katex/dist/katex.min.css";
import { type RefObject, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

interface Props {
  message: Models.ChatMessage;
  streaming?: boolean;
  streamingContentRef?: RefObject<string>;
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

const StreamingContent = ({ contentRef }: { contentRef: RefObject<string> }) => {
  const preRef = useRef<HTMLPreElement>(null);
  const lastContentRef = useRef("");
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (contentRef.current !== lastContentRef.current) {
        if (!hasContent && contentRef.current) {
          setHasContent(true);
        }
        if (preRef.current) {
          preRef.current.textContent = contentRef.current;
        }
        lastContentRef.current = contentRef.current;
      }
    }, 500);
    return () => clearInterval(timer);
  }, [contentRef, hasContent]);

  if (!hasContent) {
    return <TypingIndicator />;
  }

  return <pre ref={preRef} className="whitespace-pre-wrap font-[inherit]" />;
};

const AssistantMessage = ({ content, html, streaming, streamingContentRef }: {
  content: string;
  html?: string;
  streaming: boolean;
  streamingContentRef?: RefObject<string>;
}) => {
  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {streaming && streamingContentRef ? (
            <StreamingContent contentRef={streamingContentRef} />
          ) : content ? (
            html ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <Markdown
                components={{ pre: CodeBlock }}
                rehypePlugins={[rehypeKatex]}
                remarkPlugins={[remarkMath, remarkGfm]}
              >
                {content}
              </Markdown>
            )
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
      html={message.html}
      streaming={streaming ?? false}
      streamingContentRef={streamingContentRef}
    />
  );
};
