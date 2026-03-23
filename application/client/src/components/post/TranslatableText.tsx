import { useCallback, useState } from "react";

import { createTranslator } from "@web-speed-hackathon-2026/client/src/utils/create_translator";

type State =
  | { type: "idle"; text: string }
  | { type: "loading" }
  | { type: "translated"; text: string; original: string };

interface Props {
  text: string;
  /** When true, the first paragraph is omitted in idle state (parent already shows `text`). */
  suppressPrimaryParagraph?: boolean;
}

export const TranslatableText = ({ text, suppressPrimaryParagraph = false }: Props) => {
  const [state, updateState] = useState<State>({ type: "idle", text });

  const handleClick = useCallback(() => {
    switch (state.type) {
      case "idle": {
        (async () => {
          updateState({ type: "loading" });
          try {
            using translator = await createTranslator({
              sourceLanguage: "ja",
              targetLanguage: "en",
            });
            const result = await translator.translate(state.text);

            updateState({
              type: "translated",
              text: result,
              original: state.text,
            });
          } catch {
            updateState({
              type: "translated",
              text: "翻訳に失敗しました",
              original: state.text,
            });
          }
        })();
        break;
      }
      case "translated": {
        updateState({ type: "idle", text: state.original });
        break;
      }
      default: {
        state.type satisfies "loading";
        break;
      }
    }
  }, [state]);

  const showPrimary =
    !suppressPrimaryParagraph || state.type === "loading" || state.type === "translated";

  return (
    <>
      {showPrimary ? (
        <p>
          {state.type !== "loading" ? (
            <span>{state.text}</span>
          ) : (
            <span className="bg-cax-surface-subtle text-cax-text-muted">{text}</span>
          )}
        </p>
      ) : null}

      <p>
        <button
          className="text-cax-accent disabled:text-cax-text-subtle hover:underline disabled:cursor-default"
          type="button"
          disabled={state.type === "loading"}
          onClick={handleClick}
        >
          {state.type === "idle" ? <span>Show Translation</span> : null}
          {state.type === "loading" ? <span>Translating...</span> : null}
          {state.type === "translated" ? <span>Show Original</span> : null}
        </button>
      </p>
    </>
  );
};
