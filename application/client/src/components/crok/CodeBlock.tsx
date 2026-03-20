import { ComponentProps, Suspense, isValidElement, lazy, ReactElement, ReactNode } from "react";

const CodeBlockRenderer = lazy(async () => {
  const mod = await import("@web-speed-hackathon-2026/client/src/components/crok/CodeBlockRenderer");
  return { default: mod.CodeBlockRenderer };
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

const CodeBlockFallback = ({ code }: { code: string }) => {
  return (
    <pre
      style={{
        fontSize: "14px",
        padding: "24px 16px",
        borderRadius: "8px",
        border: "1px solid var(--color-cax-border)",
        overflowX: "auto",
      }}
    >
      <code>{code}</code>
    </pre>
  );
};

export const CodeBlock = ({ children }: ComponentProps<"pre">) => {
  if (!isCodeElement(children)) return <>{children}</>;
  const language = getLanguage(children);
  const code = children.props.children?.toString() ?? "";

  return (
    <Suspense fallback={<CodeBlockFallback code={code} />}>
      <CodeBlockRenderer code={code} language={language} />
    </Suspense>
  );
};
