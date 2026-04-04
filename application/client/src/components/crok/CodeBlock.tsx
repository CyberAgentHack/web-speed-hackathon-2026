import { ComponentProps, isValidElement, lazy, ReactElement, ReactNode, Suspense } from "react";

const LazySyntaxHighlighter = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/crok/SyntaxHighlighterLoader"),
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
    <Suspense
      fallback={
        <pre className="border-cax-border bg-cax-surface-subtle overflow-x-auto rounded-lg border px-4 py-6 text-sm">
          <code>{code}</code>
        </pre>
      }
    >
      <LazySyntaxHighlighter
        customStyle={{
          fontSize: "14px",
          padding: "24px 16px",
          borderRadius: "8px",
          border: "1px solid var(--color-cax-border)",
        }}
        language={language}
      >
        {code}
      </LazySyntaxHighlighter>
    </Suspense>
  );
};
