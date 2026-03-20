import {
  ComponentProps,
  isValidElement,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from "react";
import type SyntaxHighlighterType from "react-syntax-highlighter";

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
  const [Highlighter, setHighlighter] = useState<{
    Component: typeof SyntaxHighlighterType;
    style: Record<string, React.CSSProperties>;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      import("react-syntax-highlighter"),
      import("react-syntax-highlighter/dist/esm/styles/hljs"),
    ]).then(([mod, styleMod]) => {
      if (mounted) {
        setHighlighter({ Component: mod.default, style: styleMod.atomOneLight });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!isCodeElement(children)) return <>{children}</>;
  const language = getLanguage(children);
  const code = children.props.children?.toString() ?? "";

  if (!Highlighter) {
    return (
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
    );
  }

  return (
    <Highlighter.Component
      customStyle={{
        fontSize: "14px",
        padding: "24px 16px",
        borderRadius: "8px",
        border: "1px solid var(--color-cax-border)",
      }}
      language={language}
      style={Highlighter.style}
    >
      {code}
    </Highlighter.Component>
  );
};
