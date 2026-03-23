import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";

// @ts-expect-error -- dynamic CSS import for code splitting; no type declarations needed
void import("katex/dist/katex.min.css");

const markdownComponents = { pre: CodeBlock };
const rehypePluginsList = [rehypeKatex];
const remarkPluginsList = [remarkMath, remarkGfm];

export const MarkdownRenderer = ({ content }: { content: string }) => (
  <Markdown
    components={markdownComponents}
    rehypePlugins={rehypePluginsList}
    remarkPlugins={remarkPluginsList}
  >
    {content}
  </Markdown>
);
