import "katex/dist/katex.min.css";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";

interface Props {
  content: string;
}

export const MarkdownRenderer = ({ content }: Props) => {
  return (
    <Markdown
      components={{ pre: CodeBlock }}
      key={content}
      rehypePlugins={[rehypeKatex]}
      remarkPlugins={[remarkMath, remarkGfm]}
    >
      {content}
    </Markdown>
  );
};
