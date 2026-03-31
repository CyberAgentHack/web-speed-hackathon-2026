import { LightAsync } from "react-syntax-highlighter";
import { atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

interface Props {
  code: string;
  language: string;
}

export const CodeBlockRenderer = ({ code, language }: Props) => {
  return (
    <LightAsync
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
    </LightAsync>
  );
};
