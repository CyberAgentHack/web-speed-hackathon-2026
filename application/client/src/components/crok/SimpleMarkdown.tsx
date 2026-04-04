import { Fragment, type ReactNode } from "react";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";

type MarkdownBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; code: string; language: string };

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];

  for (let index = 0; index < lines.length; ) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (trimmed === "") {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !(lines[index] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: "code",
        code: codeLines.join("\n"),
        language,
      });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "heading", text: trimmed.slice(3).trim() });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = (lines[index] ?? "").trim();
        if (!item.startsWith("- ")) {
          break;
        }
        items.push(item.slice(2).trim());
        index += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const paragraph = lines[index] ?? "";
      const paragraphTrimmed = paragraph.trim();
      if (
        paragraphTrimmed === "" ||
        paragraphTrimmed.startsWith("## ") ||
        paragraphTrimmed.startsWith("- ") ||
        paragraphTrimmed.startsWith("```")
      ) {
        break;
      }
      paragraphLines.push(paragraph);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      text: paragraphLines.join("\n"),
    });
  }

  return blocks;
}

function renderInline(text: string): ReactNode {
  return text.split(/(`[^`]+`)/g).map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`") && segment.length >= 2) {
      return (
        <code
          className="bg-cax-surface-subtle rounded px-1.5 py-0.5 font-mono text-[0.95em]"
          key={`code-${index}`}
        >
          {segment.slice(1, -1)}
        </code>
      );
    }

    return <Fragment key={`text-${index}`}>{segment}</Fragment>;
  });
}

export const SimpleMarkdown = ({ content }: { content: string }) => {
  return parseMarkdown(content).map((block, index) => {
    if (block.type === "heading") {
      return (
        <h2 className="mt-6 mb-3 text-xl font-bold" key={index}>
          {renderInline(block.text)}
        </h2>
      );
    }

    if (block.type === "list") {
      return (
        <ul className="mb-4 list-disc space-y-2 pl-5" key={index}>
          {block.items.map((item, itemIndex) => (
            <li className="leading-relaxed" key={itemIndex}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (block.type === "code") {
      return (
        <CodeBlock key={index}>
          <code className={block.language ? `language-${block.language}` : undefined}>
            {block.code}
          </code>
        </CodeBlock>
      );
    }

    return (
      <p className="mb-4 whitespace-pre-wrap leading-relaxed" key={index}>
        {renderInline(block.text)}
      </p>
    );
  });
};
