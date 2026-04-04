import type { CSSProperties } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

type Props = {
  children: string;
  customStyle?: CSSProperties;
  language: string;
};

const SyntaxHighlighterLoader = ({ children, customStyle, language }: Props) => {
  return (
    <SyntaxHighlighter customStyle={customStyle} language={language} style={atomOneLight}>
      {children}
    </SyntaxHighlighter>
  );
};

export default SyntaxHighlighterLoader;
