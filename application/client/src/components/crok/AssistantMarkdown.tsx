import { lazy, Suspense } from "react";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { MarkdownCodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/MarkdownCodeBlock";

interface Props {
  content: string;
}

const markdownComponents = { pre: MarkdownCodeBlock };
const remarkPlugins = [remarkGfm];
const AssistantMarkdownWithMath = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/components/crok/AssistantMarkdownWithMath");
  return { default: module.AssistantMarkdownWithMath };
});

const BaseAssistantMarkdown = ({ content }: Props) => {
  return (
    <Markdown components={markdownComponents} remarkPlugins={remarkPlugins}>
      {content}
    </Markdown>
  );
};

const hasMathSyntax = (content: string) => /(^|[^\\])\$|\\\(|\\\[/.test(content);

export const AssistantMarkdown = ({ content }: Props) => {
  if (!hasMathSyntax(content)) {
    return <BaseAssistantMarkdown content={content} />;
  }

  return (
    <Suspense fallback={<BaseAssistantMarkdown content={content} />}>
      <AssistantMarkdownWithMath content={content} />
    </Suspense>
  );
};
