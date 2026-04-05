import { ComponentProps, isValidElement, ReactElement, ReactNode, Suspense, lazy } from "react";

const LazySyntaxHighlighter = lazy(() =>
  Promise.all([
    import("react-syntax-highlighter"),
    import("react-syntax-highlighter/dist/esm/styles/hljs"),
  ]).then(([mod, styles]) => ({
    default: ({ language, code }: { language: string; code: string }) => {
      const SyntaxHighlighter = mod.default;
      return (
        <SyntaxHighlighter
          customStyle={{
            fontSize: "14px",
            padding: "24px 16px",
            borderRadius: "8px",
            border: "1px solid var(--color-cax-border)",
          }}
          language={language}
          style={styles.atomOneLight}
        >
          {code}
        </SyntaxHighlighter>
      );
    },
  })),
);

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
    <Suspense fallback={<pre><code>{code}</code></pre>}>
      <LazySyntaxHighlighter language={language} code={code} />
    </Suspense>
  );
};
