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

async function loadHighlighter() {
  const [{ default: SyntaxHighlighter }, styleMod, javascript, typescript, python, json, bash, css, xml, sql, java, cpp, go, rust, ruby, php, csharp, swift, kotlin, markdown] = await Promise.all([
    import("react-syntax-highlighter/dist/esm/light"),
    import("react-syntax-highlighter/dist/esm/styles/hljs"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/javascript"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/typescript"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/python"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/json"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/bash"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/css"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/xml"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/sql"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/java"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/cpp"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/go"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/rust"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/ruby"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/php"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/csharp"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/swift"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/kotlin"),
    import("react-syntax-highlighter/dist/esm/languages/hljs/markdown"),
  ]);

  SyntaxHighlighter.registerLanguage("javascript", javascript.default);
  SyntaxHighlighter.registerLanguage("typescript", typescript.default);
  SyntaxHighlighter.registerLanguage("python", python.default);
  SyntaxHighlighter.registerLanguage("json", json.default);
  SyntaxHighlighter.registerLanguage("bash", bash.default);
  SyntaxHighlighter.registerLanguage("css", css.default);
  SyntaxHighlighter.registerLanguage("xml", xml.default);
  SyntaxHighlighter.registerLanguage("html", xml.default);
  SyntaxHighlighter.registerLanguage("sql", sql.default);
  SyntaxHighlighter.registerLanguage("java", java.default);
  SyntaxHighlighter.registerLanguage("cpp", cpp.default);
  SyntaxHighlighter.registerLanguage("go", go.default);
  SyntaxHighlighter.registerLanguage("rust", rust.default);
  SyntaxHighlighter.registerLanguage("ruby", ruby.default);
  SyntaxHighlighter.registerLanguage("php", php.default);
  SyntaxHighlighter.registerLanguage("csharp", csharp.default);
  SyntaxHighlighter.registerLanguage("swift", swift.default);
  SyntaxHighlighter.registerLanguage("kotlin", kotlin.default);
  SyntaxHighlighter.registerLanguage("markdown", markdown.default);

  return { Component: SyntaxHighlighter as typeof SyntaxHighlighterType, style: styleMod.atomOneLight };
}

export const CodeBlock = ({ children }: ComponentProps<"pre">) => {
  const [Highlighter, setHighlighter] = useState<{
    Component: typeof SyntaxHighlighterType;
    style: Record<string, React.CSSProperties>;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    loadHighlighter().then((result) => {
      if (mounted) {
        setHighlighter(result);
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
