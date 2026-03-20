import { lazy, memo, Suspense, useEffect, useState } from "react";

import Markdown from "react-markdown";

interface Props {
  content: string;
}

const CrokRichMarkdownMessage = lazy(async () =>
  import("@web-speed-hackathon-2026/client/src/components/crok/CrokRichMarkdownMessage").then(
    (module) => ({
      default: module.CrokRichMarkdownMessage,
    }),
  ),
);

const RICH_MARKDOWN_DELAY_MS = 750;

function hasRichMarkdown(content: string) {
  return /```|`[^`\n]+`|\$[^$\n]+\$|\$\$[\s\S]+?\$\$|\|.+\|/.test(content);
}

const BasicMarkdownMessage = memo(({ content }: Props) => <Markdown>{content}</Markdown>);

export const CrokMarkdownMessage = memo(({ content }: Props) => {
  const [shouldRenderRich, setShouldRenderRich] = useState(false);
  const needsRichMarkdown = hasRichMarkdown(content);

  useEffect(() => {
    setShouldRenderRich(false);

    if (!needsRichMarkdown) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldRenderRich(true);
    }, RICH_MARKDOWN_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [content, needsRichMarkdown]);

  if (!needsRichMarkdown || !shouldRenderRich) {
    return <BasicMarkdownMessage content={content} />;
  }

  return (
    <Suspense fallback={<BasicMarkdownMessage content={content} />}>
      <CrokRichMarkdownMessage content={content} />
    </Suspense>
  );
});
