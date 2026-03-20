import { ComponentProps, isValidElement, lazy, ReactElement, ReactNode, Suspense } from "react";

const HighlighterRenderer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/crok/HighlighterRenderer").then((m) => ({
    default: m.HighlighterRenderer,
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
    <Suspense
      fallback={
        <pre
          style={{
            fontSize: "14px",
            padding: "24px 16px",
            borderRadius: "8px",
            border: "1px solid var(--color-cax-border)",
            whiteSpace: "pre-wrap",
          }}
        >
          {code}
        </pre>
      }
    >
      <HighlighterRenderer language={language} code={code} />
    </Suspense>
  );
};
