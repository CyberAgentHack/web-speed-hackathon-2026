import { lazy, memo, Suspense, useCallback, useState, useEffect } from "react";

import { createTranslator } from "@web-speed-hackathon-2026/client/src/utils/create_translator";
 
 const LazyMarkdown = lazy(() => import(/* webpackChunkName: "MarkdownRenderer" */ "../crok/MarkdownRenderer"));

type State =
  | { type: "idle"; text: string }
  | { type: "loading" }
  | { type: "translated"; text: string; original: string };

interface Props {
  text: string;
}

export const TranslatableText = memo(({ text }: Props) => {
  const [state, updateState] = useState<State>({ type: "idle", text });
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let id: number;
    if (typeof window.requestIdleCallback === "function") {
      id = window.requestIdleCallback(() => setIsIdle(true), { timeout: 2000 });
    } else {
      id = window.setTimeout(() => setIsIdle(true), 100);
    }
    return () => {
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(id);
      } else {
        window.clearTimeout(id);
      }
    };
  }, []);

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

  return (
    <>
      <p>
         <Suspense fallback={<div className="animate-pulse bg-cax-surface-subtle h-4 w-full rounded" />}>
            {state.type !== "loading" ? (
              isIdle ? <LazyMarkdown content={state.text} /> : <span className="bg-cax-surface-subtle text-cax-text-muted">{text}</span>
            ) : (
             <span className="bg-cax-surface-subtle text-cax-text-muted">{text}</span>
           )}
         </Suspense>
       </p>

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
});

TranslatableText.displayName = "TranslatableText";
