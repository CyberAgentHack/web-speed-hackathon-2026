import { ComponentProps, isValidElement, lazy, ReactElement, ReactNode, Suspense, useEffect, useState } from "react";

const SyntaxHighlighter = lazy(() =>
  import("react-syntax-highlighter/dist/esm/light").then(async (m) => {
    const [js, ts, python, bash, json, css, html, sql, java, go, rust, cpp, markdown] =
      await Promise.all([
        import("react-syntax-highlighter/dist/esm/languages/hljs/javascript"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/typescript"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/python"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/bash"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/json"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/css"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/xml"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/sql"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/java"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/go"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/rust"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/cpp"),
        import("react-syntax-highlighter/dist/esm/languages/hljs/markdown"),
      ]);
    const SHL = m.default;
    SHL.registerLanguage("javascript", js.default);
    SHL.registerLanguage("typescript", ts.default);
    SHL.registerLanguage("python", python.default);
    SHL.registerLanguage("bash", bash.default);
    SHL.registerLanguage("json", json.default);
    SHL.registerLanguage("css", css.default);
    SHL.registerLanguage("html", html.default);
    SHL.registerLanguage("sql", sql.default);
    SHL.registerLanguage("java", java.default);
    SHL.registerLanguage("go", go.default);
    SHL.registerLanguage("rust", rust.default);
    SHL.registerLanguage("cpp", cpp.default);
    SHL.registerLanguage("markdown", markdown.default);
    return { default: SHL };
  }),
);

let cachedStyle: Record<string, React.CSSProperties> | null = null;

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
  const [style, setStyle] = useState<Record<string, React.CSSProperties> | null>(cachedStyle);

  useEffect(() => {
    if (!cachedStyle) {
      import("react-syntax-highlighter/dist/esm/styles/hljs").then((m) => {
        cachedStyle = m.atomOneLight;
        setStyle(m.atomOneLight);
      });
    }
  }, []);

  if (!isCodeElement(children)) return <>{children}</>;
  const language = getLanguage(children);
  const code = children.props.children?.toString() ?? "";

  if (!style) {
    return <pre><code>{code}</code></pre>;
  }

  return (
    <Suspense fallback={<pre><code>{code}</code></pre>}>
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
    </Suspense>
  );
};
