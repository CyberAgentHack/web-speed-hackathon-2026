import "katex/dist/katex.min.css";
import { useMemo } from "react";

import { renderMarkdown } from "@web-speed-hackathon-2026/client/src/utils/render_markdown";

interface Props {
  content: string;
}

export const MarkdownRenderer = ({ content }: Props) => {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className="crok-markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
