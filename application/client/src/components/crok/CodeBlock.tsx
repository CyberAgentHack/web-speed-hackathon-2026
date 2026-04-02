import { isValidElement, useEffect, useState } from "react";
import type { ComponentProps, ReactElement, ReactNode } from "react";

type SyntaxHighlighterType = typeof import("react-syntax-highlighter").default;
type SyntaxStyle = typeof import("react-syntax-highlighter/dist/esm/styles/hljs").atomOneLight;

const getLanguage = (children: ReactElement<ComponentProps<"code">>) => {
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
  const [highlighter, setHighlighter] = useState<SyntaxHighlighterType | null>(null);
  const [style, setStyle] = useState<SyntaxStyle | null>(null);

  useEffect(() => {
    void Promise.all([
      import("react-syntax-highlighter"),
      import("react-syntax-highlighter/dist/esm/styles/hljs"),
    ]).then(([highlighterModule, stylesModule]) => {
      setHighlighter(() => highlighterModule.default);
      setStyle(stylesModule.atomOneLight);
    });
  }, []);

  if (!isCodeElement(children)) return <>{children}</>;

  const language = getLanguage(children);
  const code = children.props.children?.toString() ?? "";

  if (highlighter === null || style === null) {
    return (
      <pre className="border-cax-border bg-cax-surface-subtle overflow-x-auto rounded-lg border px-4 py-6 text-sm">
        <code>{code}</code>
      </pre>
    );
  }

  const SyntaxHighlighter = highlighter;

  return (
    <SyntaxHighlighter
      customStyle={{
        fontSize: "14px",
        padding: "24px 16px",
        borderRadius: "8px",
        border: "1px solid var(--color-cax-border)",
      }}
      language={language}
      style={style}
    >
      {code}
    </SyntaxHighlighter>
  );
};
