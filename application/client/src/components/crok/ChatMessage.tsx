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
  streaming?: boolean;
}

function extractHeadings(content: string): Array<{ level: 1 | 2 | 3; text: string }> {
  return Array.from(content.matchAll(/^(#{1,3})\s+(.+)$/gm)).map((match) => ({
    level: Math.min(match[1]!.length, 3) as 1 | 2 | 3,
    text: match[2]!.trim(),
  }));
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
  const headings = streaming ? extractHeadings(content) : [];

  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {streaming ? (
            <div className="grid gap-y-4">
              <TypingIndicator />
              {headings.map(({ level, text }, index) => {
                if (level === 1) {
                  return (
                    <h1 className="text-3xl font-bold" key={`${level}-${index}`}>
                      {text}
                    </h1>
                  );
                }
                if (level === 2) {
                  return (
                    <h2 className="text-2xl font-bold" key={`${level}-${index}`}>
                      {text}
                    </h2>
                  );
                }
                return (
                  <h3 className="text-xl font-bold" key={`${level}-${index}`}>
                    {text}
                  </h3>
                );
              })}
              {content ? <div className="whitespace-pre-wrap">{content}</div> : null}
            </div>
          ) : content ? (
            <Markdown
              components={{ pre: CodeBlock }}
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

export const ChatMessage = ({ message, streaming = false }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return <AssistantMessage content={message.content} streaming={streaming} />;
};
