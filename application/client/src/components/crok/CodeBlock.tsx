import { ComponentProps, isValidElement, ReactElement, ReactNode } from "react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/light";
import { atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import typescript from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import rust from "react-syntax-highlighter/dist/esm/languages/hljs/rust";
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";

SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("javascript", javascript);

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
  );
};
