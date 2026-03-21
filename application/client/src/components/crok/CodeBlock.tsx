import { ComponentProps, isValidElement, ReactElement, ReactNode, useEffect, useState } from "react";

interface HighlighterState {
  SyntaxHighlighter: null | ((props: any) => ReactElement);
  style: unknown;
}

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
  if (!isCodeElement(children)) return <>{children}</>;
  const language = getLanguage(children);
  const code = children.props.children?.toString() ?? "";
  const [{ SyntaxHighlighter, style }, setHighlighter] = useState<HighlighterState>({
    SyntaxHighlighter: null,
    style: null,
  });

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      import("react-syntax-highlighter"),
      import("react-syntax-highlighter/dist/esm/styles/hljs"),
    ]).then(([highlighterModule, styleModule]) => {
      if (cancelled) {
        return;
      }

      setHighlighter({
        SyntaxHighlighter: highlighterModule.default,
        style: styleModule.atomOneLight,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (SyntaxHighlighter == null || style == null) {
    return (
      <pre className="border-cax-border bg-cax-surface-subtle overflow-x-auto rounded-lg border px-4 py-3 text-sm">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <SyntaxHighlighter
      customStyle={{
        fontSize: "14px",
        padding: "24px 16px",
        borderRadius: "8px",
        border: "1px solid var(--color-cax-border)",
      }}
      language={language}
      style={style as any}
    >
      {code}
    </SyntaxHighlighter>
  );
};
