import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { useEffect, useMemo } from "react";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

// #4: katex.min.css を数式が登場したときのみ動的ロード
let katexCssLoaded = false;
function loadKatexCss() {
  if (katexCssLoaded) return;
  katexCssLoaded = true;
  // webpackが非同期CSSチャンクを生成し、ロード時に<link>を自動挿入する
  import("katex/dist/katex.min.css").catch(() => {});
}

interface Props {
  message: Models.ChatMessage;
}

// #2: plugins をモジュールレベル定数で安定化（毎レンダリングで新しい配列を作らない）
const REMARK_GFM_PLUGINS = [remarkGfm];
const REMARK_MATH_PLUGINS = [remarkMath, remarkGfm];
const REHYPE_KATEX_PLUGINS = [rehypeKatex];
const REHYPE_EMPTY_PLUGINS: never[] = [];

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

  const hasMath = useMemo(() => /\$/.test(content), [content]);

  useEffect(() => {
    if (hasMath) loadKatexCss();
  }, [hasMath]);

  const remarkPlugins = hasMath ? REMARK_MATH_PLUGINS : REMARK_GFM_PLUGINS;
  const rehypePlugins = hasMath ? REHYPE_KATEX_PLUGINS : REHYPE_EMPTY_PLUGINS;

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
              components={{ pre: CodeBlock }}
              rehypePlugins={rehypePlugins}
              remarkPlugins={remarkPlugins}
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
