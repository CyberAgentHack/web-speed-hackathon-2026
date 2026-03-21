import "katex/dist/katex.min.css";
import { useDeferredValue } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

const remarkPlugins = [remarkMath, remarkGfm];
const rehypePlugins = [rehypeKatex];

interface Props {
  message: Models.ChatMessage;
  /** 最後のアシスタントのストリーミング中は useDeferredValue で重い Markdown 更新を遅延 */
  assistantStreaming?: boolean;
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

const AssistantMessage = ({ content, streaming }: { content: string; streaming: boolean }) => {
  const deferredContent = useDeferredValue(content);
  const markdownSource = streaming ? deferredContent : content;

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
          ) : (
            <Markdown
              components={{ pre: CodeBlock }}
              rehypePlugins={rehypePlugins}
              remarkPlugins={remarkPlugins}
            >
              {markdownSource}
            </Markdown>
          )}
        </div>
      </div>
    </div>
  );
};

export const ChatMessage = ({ message, assistantStreaming = false }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return <AssistantMessage content={message.content} streaming={assistantStreaming} />;
};
