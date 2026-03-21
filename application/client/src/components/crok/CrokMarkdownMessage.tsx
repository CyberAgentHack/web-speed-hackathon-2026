import { lazy, memo, Suspense, useEffect, useState } from "react";
import Markdown from "react-markdown";

const RICH_MARKDOWN_DELAY_MS = 750;

const RichMarkdown = lazy(() =>
  import(
    "@web-speed-hackathon-2026/client/src/components/crok/CrokRichMarkdownMessage"
  ).then((m) => ({ default: m.CrokRichMarkdownMessage })),
);

function hasRichMarkdown(content: string): boolean {
  return /```|`[^`\n]+`|\$[^$\n]+\$|\$\$[\s\S]+?\$\$|\|.+\|/.test(content);
}

const BasicMarkdown = memo(({ content }: { content: string }) => (
  <Markdown>{content}</Markdown>
));

interface Props {
  content: string;
}

export const CrokMarkdownMessage = memo(({ content }: Props) => {
  const [shouldRenderRich, setShouldRenderRich] = useState(false);
  const needsRich = hasRichMarkdown(content);

  useEffect(() => {
    setShouldRenderRich(false);
    if (!needsRich) return;
    const id = window.setTimeout(() => setShouldRenderRich(true), RICH_MARKDOWN_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [content, needsRich]);

  if (!needsRich || !shouldRenderRich) {
    return <BasicMarkdown content={content} />;
  }

  return (
    <Suspense fallback={<BasicMarkdown content={content} />}>
      <RichMarkdown content={content} />
    </Suspense>
  );
});
