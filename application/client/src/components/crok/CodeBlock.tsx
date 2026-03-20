import { ComponentProps, isValidElement, ReactElement, ReactNode } from "react";
import { LightAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  sh: "bash",
  zsh: "bash",
  yml: "yaml",
  mermaid: "mermaid",
};

function resolveLanguage(lang: string): string {
  return LANGUAGE_ALIASES[lang] ?? lang;
}

const getRawLanguage = (children: ReactElement<ComponentProps<"code">>) => {
  const className = children.props.className;
  if (typeof className === "string") {
    const match = className.match(/language-(\w+)/);
    return match?.[1] ?? "javascript";
  }
  return "javascript";
};

const isCodeElement = (children: ReactNode): children is ReactElement<ComponentProps<"code">> =>
  isValidElement(children) && children.type === "code";

export const CodeBlock = ({ children }: ComponentProps<"pre">) => {
  if (!isCodeElement(children)) return <>{children}</>;

  const rawLanguage = getRawLanguage(children);
  const language = resolveLanguage(rawLanguage);
  const code = children.props.children?.toString() ?? "";

  return (
    <SyntaxHighlighter
      codeTagProps={{ className: `language-${rawLanguage}` }}
      customStyle={{
        fontSize: "14px",
        padding: "24px 16px",
        borderRadius: "8px",
        border: "1px solid var(--color-cax-border)",
      }}
      language={language}
      style={atomOneLight}
    >
      {code}
    </SyntaxHighlighter>
  );
};
