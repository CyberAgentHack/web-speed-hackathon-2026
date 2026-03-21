import "katex/dist/katex.min.css";
import { memo, useDeferredValue, useMemo } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

const remarkPlugins = [remarkMath, remarkGfm];
const rehypePlugins = [rehypeKatex];
const markdownComponents = { pre: CodeBlock };

function splitContentIntoChunks(content: string): string[] {
  if (!content) return [];
  const lines = content.split("\n");
  const chunks: string[] = [];
  let chunkStart = 0;
  let inCodeFence = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.trimStart().startsWith("```")) {
      inCodeFence = !inCodeFence;
    }
    if (!inCodeFence && lines[i] === "" && i > chunkStart) {
      const chunk = lines.slice(chunkStart, i).join("\n");
      if (chunk.trim()) chunks.push(chunk);
      chunkStart = i + 1;
    }
  }

  const remaining = lines.slice(chunkStart).join("\n");
  if (remaining.trim()) chunks.push(remaining);
  return chunks;
}

interface Props {
  message: Models.ChatMessage;
  /** 最後のアシスタントのストリーミング中は useDeferredValue で重い Markdown 更新を遅延 */
  assistantStreaming?: boolean;
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

const MemoizedMarkdownChunk = memo(({ content }: { content: string }) => (
  <Markdown
    components={markdownComponents}
    rehypePlugins={rehypePlugins}
    remarkPlugins={remarkPlugins}
  >
    {content}
  </Markdown>
));

const AssistantMessage = memo(({ content, streaming }: { content: string; streaming: boolean }) => {
  const deferredContent = useDeferredValue(content);
  const markdownSource = streaming ? deferredContent : content;
  const chunks = useMemo(() => splitContentIntoChunks(markdownSource), [markdownSource]);

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
            chunks.map((chunk, i) => <MemoizedMarkdownChunk key={i} content={chunk} />)
          )}
        </div>
      </div>
    </div>
  );
});

export const ChatMessage = memo(({ message, assistantStreaming = false }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return <AssistantMessage content={message.content} streaming={assistantStreaming} />;
});
