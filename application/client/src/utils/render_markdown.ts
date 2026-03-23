import katex from "katex";
import { Marked } from "marked";

const mathBlockRule = /^\$\$([\s\S]+?)\$\$/;
const mathInlineRule = /^\$([^\n$]+?)\$/;

const mathExtension = {
  extensions: [
    {
      name: "mathBlock",
      level: "block" as const,
      start(src: string) {
        return src.indexOf("$$");
      },
      tokenizer(src: string) {
        const match = mathBlockRule.exec(src);
        if (match) {
          return {
            type: "mathBlock",
            raw: match[0],
            text: match[1]!.trim(),
          };
        }
      },
      renderer(token: { text: string }) {
        try {
          return `<div class="katex-block">${katex.renderToString(token.text, { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<div class="katex-block"><pre>${token.text}</pre></div>`;
        }
      },
    },
    {
      name: "mathInline",
      level: "inline" as const,
      start(src: string) {
        return src.indexOf("$");
      },
      tokenizer(src: string) {
        const match = mathInlineRule.exec(src);
        if (match) {
          return {
            type: "mathInline",
            raw: match[0],
            text: match[1]!.trim(),
          };
        }
      },
      renderer(token: { text: string }) {
        try {
          return katex.renderToString(token.text, { displayMode: false, throwOnError: false });
        } catch {
          return `<code>${token.text}</code>`;
        }
      },
    },
  ],
};

const marked = new Marked({ gfm: true });
marked.use(mathExtension);

export function renderMarkdown(content: string): string {
  return marked.parse(content) as string;
}
