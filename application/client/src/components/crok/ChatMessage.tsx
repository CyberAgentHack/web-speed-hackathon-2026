import "katex/dist/katex.min.css";
import React, { lazy, Suspense } from "react";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

const Markdown = lazy(() => import("react-markdown"));
const remarkGfm = import("remark-gfm").then((m) => m.default);
const remarkMath = import("remark-math").then((m) => m.default);
const rehypeKatex = import("rehype-katex").then((m) => m.default);
let plugins: { remarkPlugins: any[]; rehypePlugins: any[] } | null = null;
const getPlugins = async () => {
  if (!plugins)
    plugins = {
      remarkPlugins: [await remarkMath, await remarkGfm],
      rehypePlugins: [await rehypeKatex],
    };
  return plugins;
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
  const [loadedPlugins, setLoadedPlugins] = React.useState(plugins);
  React.useEffect(() => {
    if (!loadedPlugins) getPlugins().then(setLoadedPlugins);
  }, []);
  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {content && loadedPlugins ? (
            <Suspense fallback={<TypingIndicator />}>
              <Markdown
                components={{ pre: CodeBlock }}
                rehypePlugins={loadedPlugins.rehypePlugins}
                remarkPlugins={loadedPlugins.remarkPlugins}
              >
                {content}
              </Markdown>
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
