import React, { useState } from "react";

// import { createTranslator } from "...";

type TranslateState =
  | { type: "idle"; text: string }
  | { type: "loading" }
  | { type: "translated"; text: string; original: string };

type Props = {
  text: string;
};

export const TranslatableText: React.FC<Props> = ({ text }) => {
  const [state, setState] = useState<TranslateState>({
    type: "idle",
    text,
  });

  const handleTranslate = async () => {
    if (state.type === "loading") return;

    setState({ type: "loading" });

    // 動的importに変更（超重要）
    const { createTranslator } = await import(
      "@web-speed-hackathon-2026/client/src/utils/create_translator"
    );

    const translator = createTranslator();
    const translated = await translator.translate(text);

    setState({
      type: "translated",
      text: translated,
      original: text,
    });
  };

  return (
    <div>
      <span>
        {state.type === "translated"
          ? state.text
          : state.type === "idle"
          ? state.text
          : "Translating..."}
      </span>
      <button onClick={handleTranslate}>Translate</button>
    </div>
  );
};
