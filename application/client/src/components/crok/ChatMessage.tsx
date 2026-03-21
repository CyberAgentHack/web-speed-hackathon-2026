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
  streamingHtmlRef?: RefObject<string | null>;
  onStreamingComplete?: () => void;
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

const StreamingContent = ({ contentRef, htmlRef, onComplete }: {
  contentRef: RefObject<string>;
  htmlRef: RefObject<string | null>;
  onComplete: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const lastContentRef = useRef("");
  const completedRef = useRef(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (completedRef.current) return;

      if (htmlRef.current && containerRef.current) {
        completedRef.current = true;
        clearInterval(timer);
        containerRef.current.innerHTML = htmlRef.current;
        onComplete();
        return;
      }

      if (contentRef.current !== lastContentRef.current) {
        if (!hasContent && contentRef.current) {
          setHasContent(true);
        }
        if (preRef.current) {
          preRef.current.textContent = contentRef.current;
        }
        lastContentRef.current = contentRef.current;
      }
    }, 100);
    return () => clearInterval(timer);
  }, [contentRef, htmlRef, hasContent, onComplete]);

  if (!hasContent) {
    return <TypingIndicator />;
  }

  return (
    <div ref={containerRef}>
      <pre ref={preRef} className="whitespace-pre-wrap font-[inherit]" />
    </div>
  );
};

const AssistantMessage = ({ content, html, streaming, streamingContentRef, streamingHtmlRef, onStreamingComplete }: {
  content: string;
  html?: string;
  streaming: boolean;
  streamingContentRef?: RefObject<string>;
  streamingHtmlRef?: RefObject<string | null>;
  onStreamingComplete?: () => void;
}) => {
  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {streaming && streamingContentRef && streamingHtmlRef && onStreamingComplete ? (
            <StreamingContent contentRef={streamingContentRef} htmlRef={streamingHtmlRef} onComplete={onStreamingComplete} />
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

export const ChatMessage = ({ message, streaming, streamingContentRef, streamingHtmlRef, onStreamingComplete }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return (
    <AssistantMessage
      content={message.content}
      html={message.html}
      streaming={streaming ?? false}
      streamingContentRef={streamingContentRef}
      streamingHtmlRef={streamingHtmlRef}
      onStreamingComplete={onStreamingComplete}
    />
  );
};
