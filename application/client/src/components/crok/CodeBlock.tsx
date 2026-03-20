import { ComponentProps, isValidElement, lazy, ReactElement, ReactNode, Suspense } from "react";

const LazySyntaxHighlighter = lazy(async () => {
  const [{ default: SyntaxHighlighter }, { atomOneLight }] = await Promise.all([
    import("react-syntax-highlighter"),
    import("react-syntax-highlighter/dist/esm/styles/hljs"),
  ]);

  return {
    default: ({ language, code }: { language: string; code: string }) => (
      <SyntaxHighlighter
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
    ),
  };
});

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

  return (
    <Suspense
      fallback={
        <pre
          style={{
            fontSize: "14px",
            padding: "24px 16px",
            borderRadius: "8px",
            border: "1px solid var(--color-cax-border)",
          }}
        >
          <code>{code}</code>
        </pre>
      }
    >
      <LazySyntaxHighlighter code={code} language={language} />
    </Suspense>
  );
};
