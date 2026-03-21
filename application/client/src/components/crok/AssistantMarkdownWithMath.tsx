import "katex/dist/katex.min.css";

import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { MarkdownCodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/MarkdownCodeBlock";

interface Props {
  content: string;
}

const markdownComponents = { pre: MarkdownCodeBlock };
const remarkPlugins = [remarkMath, remarkGfm];
const rehypePlugins = [rehypeKatex];

export const AssistantMarkdownWithMath = ({ content }: Props) => {
  return (
    <Markdown components={markdownComponents} rehypePlugins={rehypePlugins} remarkPlugins={remarkPlugins}>
      {content}
    </Markdown>
  );
};
