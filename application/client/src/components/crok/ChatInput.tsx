import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
}
const CHAT_INPUT_DEBOUNCE_MS = 300;

export const ChatInput = ({ isStreaming, onSendMessage }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // サジェストが更新されたら一番下にスクロール
  useLayoutEffect(() => {
    if (suggestionsRef.current && showSuggestions) {
      suggestionsRef.current.scrollTop = suggestionsRef.current.scrollHeight;
    }
  }, [suggestions, showSuggestions]);

  useEffect(() => {
    let cancelled = false;

    if (!inputValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      const { suggestions: results } = await fetchJSON<{ suggestions: string[] }>(
        `/api/v1/crok/suggestions?q=${encodeURIComponent(inputValue)}`,
      );
      if (cancelled) {
        return;
      }

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, CHAT_INPUT_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inputValue]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    adjustTextareaHeight();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isStreaming) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
      resetTextareaHeight();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-cax-border bg-cax-surface sticky bottom-12 border-t px-4 py-4 lg:bottom-0">
      <form className="relative mx-auto max-w-2xl" onSubmit={handleSubmit}>
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="border-cax-border bg-cax-surface absolute right-0 bottom-full left-0 z-10 mb-2 max-h-[30vh] overflow-y-auto rounded-lg border shadow-lg"
            role="listbox"
            aria-label="サジェスト候補"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="border-cax-border text-cax-text-muted hover:bg-cax-surface-subtle w-full border-b px-4 py-2 text-left text-sm last:border-b-0"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <div className="border-cax-border bg-cax-surface-subtle focus-within:border-cax-brand-strong relative flex items-end rounded-2xl border transition-colors">
          <textarea
            ref={textareaRef}
            className="text-cax-text placeholder-cax-text-subtle max-h-[200px] min-h-[52px] flex-1 resize-none overflow-y-auto bg-transparent py-3 pr-2 pl-4 focus:outline-none"
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            lang="ja"
            rows={1}
            value={inputValue}
          />
          <div className="flex items-end pr-[6px] pb-[6px]">
            <button
              aria-label="送信"
              className="bg-cax-brand text-cax-surface-raised hover:bg-cax-brand-strong disabled:bg-cax-surface-subtle shrink-0 rounded-xl p-2.5 transition-colors disabled:cursor-not-allowed"
              disabled={isStreaming || !inputValue.trim()}
              type="submit"
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <FontAwesomeIcon iconType="arrow-right" styleType="solid" />
              </span>
            </button>
          </div>
        </div>
        <p className="text-cax-text-subtle mt-2 text-center text-xs">
          {isStreaming ? "AIが応答を生成中..." : "Crok AIは間違いを起こす可能性があります。"}
        </p>
      </form>
    </div>
  );
};
