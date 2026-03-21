import "katex/dist/katex.min.css";
import { useEffect, useRef, useState } from "react";

import { renderMarkdown } from "@web-speed-hackathon-2026/client/src/utils/render_markdown";

interface Props {
  content: string;
}

// マークダウンをセクション単位で分割し、非同期的にレンダリングする
function splitIntoSections(content: string): string[] {
  // 空行（\n\n）で段落を分割。ただしコードブロックや数式ブロック内は分割しない
  const sections: string[] = [];
  let current = "";
  let inCodeBlock = false;
  let inMathBlock = false;

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith("```")) inCodeBlock = !inCodeBlock;
    if (line.startsWith("$$")) inMathBlock = !inMathBlock;

    current += (current ? "\n" : "") + line;

    // コード/数式ブロック外で空行が来たらセクションを区切る
    if (!inCodeBlock && !inMathBlock && line === "" && current.trim()) {
      sections.push(current);
      current = "";
    }
  }
  if (current.trim()) {
    sections.push(current);
  }

  // 小さすぎるセクションをまとめる（最低3セクションずつ）
  const merged: string[] = [];
  for (let i = 0; i < sections.length; i += 3) {
    merged.push(sections.slice(i, i + 3).join("\n"));
  }

  return merged;
}

export const MarkdownRenderer = ({ content }: Props) => {
  const [renderedHtml, setRenderedHtml] = useState("");
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
    const sections = splitIntoSections(content);

    if (sections.length <= 1) {
      // 短いコンテンツはそのままレンダリング
      setRenderedHtml(renderMarkdown(content));
      return;
    }

    // セクションごとに rAF で分割レンダリング
    let html = "";
    let idx = 0;
    let cancelled = false;

    const renderNext = () => {
      if (cancelled || idx >= sections.length) return;

      const section = sections[idx]!;
      html += renderMarkdown(section);
      idx++;
      setRenderedHtml(html);

      if (idx < sections.length) {
        requestAnimationFrame(renderNext);
      }
    };

    requestAnimationFrame(renderNext);

    return () => {
      cancelled = true;
    };
  }, [content]);

  return (
    <div
      className="crok-markdown"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
