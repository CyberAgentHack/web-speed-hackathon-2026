import "katex/dist/katex.min.css";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";

interface Props {
  content: string;
}

export const AssistantMessageContent = ({ content }: Props) => {
  return content ? (
    <Markdown
      components={{ pre: CodeBlock }}
      rehypePlugins={[rehypeKatex]}
      remarkPlugins={[remarkMath, remarkGfm]}
    >
      {content}
    </Markdown>
  ) : (
    <TypingIndicator />
  );
};
