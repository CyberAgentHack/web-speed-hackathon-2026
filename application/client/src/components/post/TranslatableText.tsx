import { memo, useCallback, useEffect, useState } from "react";

type State =
  | { type: "idle"; text: string }
  | { type: "loading"; text: string }
  | { type: "translated"; text: string; original: string };

interface Props {
  text: string;
}

const CACHE_LIMIT = 128;
const translatedTextCache = new Map<string, string>();
const inFlightTranslationCache = new Map<string, Promise<string>>();

function setCachedTranslation(sourceText: string, translatedText: string): void {
  translatedTextCache.set(sourceText, translatedText);
  if (translatedTextCache.size <= CACHE_LIMIT) {
    return;
  }
  const oldestKey = translatedTextCache.keys().next().value;
  if (oldestKey !== undefined) {
    translatedTextCache.delete(oldestKey);
  }
}

async function translateWithCache(sourceText: string): Promise<string> {
  const cached = translatedTextCache.get(sourceText);
  if (cached != null) {
    return cached;
  }

  const inFlight = inFlightTranslationCache.get(sourceText);
  if (inFlight != null) {
    return inFlight;
  }

  const translationPromise = (async () => {
    const { createTranslator } =
      await import("@web-speed-hackathon-2026/client/src/utils/create_translator");
    using translator = await createTranslator({
      sourceLanguage: "ja",
      targetLanguage: "en",
    });
    return translator.translate(sourceText);
  })();
  inFlightTranslationCache.set(sourceText, translationPromise);

  try {
    const translated = await translationPromise;
    setCachedTranslation(sourceText, translated);
    return translated;
  } finally {
    inFlightTranslationCache.delete(sourceText);
  }
}

export const TranslatableText = memo(({ text }: Props) => {
  const [state, updateState] = useState<State>(() => ({ type: "idle", text }));

  useEffect(() => {
    updateState({ type: "idle", text });
  }, [text]);

  const translateText = useCallback(async (sourceText: string) => {
    try {
      const translated = await translateWithCache(sourceText);
      updateState((current) => {
        if (current.type !== "loading" || current.text !== sourceText) {
          return current;
        }
        return {
          type: "translated",
          text: translated,
          original: sourceText,
        };
      });
    } catch {
      updateState((current) => {
        if (current.type !== "loading" || current.text !== sourceText) {
          return current;
        }
        return {
          type: "translated",
          text: "翻訳に失敗しました",
          original: sourceText,
        };
      });
    }
  }, []);

  const handleClick = useCallback(() => {
    updateState((current) => {
      if (current.type === "idle") {
        void translateText(current.text);
        return { type: "loading", text: current.text };
      }
      if (current.type === "translated") {
        return { type: "idle", text: current.original };
      }
      current.type satisfies "loading";
      return current;
    });
  }, [translateText]);

  return (
    <>
      <p>
        {state.type !== "loading" ? (
          <span>{state.text}</span>
        ) : (
          <span className="bg-cax-surface-subtle text-cax-text-muted">{text}</span>
        )}
      </p>

      <p>
        <button
          className="text-cax-accent disabled:text-cax-text-subtle hover:underline disabled:cursor-default"
          type="button"
          disabled={state.type === "loading"}
          onClick={handleClick}
        >
          {state.type === "idle" ? (
            <span>Show Translation</span>
          ) : state.type === "loading" ? (
            <span>Translating...</span>
          ) : (
            <span>Show Original</span>
          )}
        </button>
      </p>
    </>
  );
});
