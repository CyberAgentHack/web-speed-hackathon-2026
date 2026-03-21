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

const MIN_SUGGESTION_QUERY_LENGTH = 3;
const SUGGESTION_DEBOUNCE_MS = 280;

function getQueryTerms(query: string): string[] {
  return query
    .toLowerCase()
    .normalize("NFKC")
    .split(/[\s\u3000、。,.!?！？/\\-]+/u)
    .map((term) => term.trim())
    .filter((term) => term !== "");
}

function highlightMatchByQuery(text: string, query: string): React.ReactNode {
  const queryTerms = getQueryTerms(query);
  if (queryTerms.length === 0) {
    return text;
  }

  const lowerText = text.toLowerCase().normalize("NFKC");
  const ranges: { start: number; end: number }[] = [];

  for (const term of queryTerms) {
    let position = 0;
    while (position < lowerText.length) {
      const index = lowerText.indexOf(term, position);
      if (index === -1) {
        break;
      }
      ranges.push({ start: index, end: index + term.length });
      position = index + 1;
    }
  }

  if (ranges.length === 0) {
    return text;
  }

  ranges.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [ranges[0]!];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1]!;
    const curr = ranges[i]!;
    if (curr.start <= prev.end) {
      prev.end = Math.max(prev.end, curr.end);
    } else {
      merged.push(curr);
    }
  }

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;
  for (let i = 0; i < merged.length; i++) {
    const range = merged[i]!;
    if (range.start > lastEnd) {
      parts.push(text.slice(lastEnd, range.start));
    }
    parts.push(
      <span key={i} className="bg-cax-highlight text-cax-highlight-ink">
        {text.slice(range.start, range.end)}
      </span>,
    );
    lastEnd = range.end;
  }
  if (lastEnd < text.length) {
    parts.push(text.slice(lastEnd));
  }

  return <>{parts}</>;
}

export const ChatInput = ({ isStreaming, onSendMessage }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const resizeFrameIdRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const lastSelectedSuggestionRef = useRef<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useLayoutEffect(() => {
    if (suggestionsRef.current && showSuggestions) {
      suggestionsRef.current.scrollTop = suggestionsRef.current.scrollHeight;
    }
  }, [suggestions, showSuggestions]);

  useEffect(() => {
    if (isStreaming) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = inputValue.trim();
    if (query.length < MIN_SUGGESTION_QUERY_LENGTH) {
      setSuggestions([]);
      setShowSuggestions(false);
      lastSelectedSuggestionRef.current = null;
      return;
    }

    if (lastSelectedSuggestionRef.current === query) {
      setShowSuggestions(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setShowSuggestions(false);
    setSuggestions([]);

    const timer = window.setTimeout(() => {
      void fetchJSON<{ suggestions: string[] }>(
        `/api/v1/crok/suggestions?q=${encodeURIComponent(query)}`,
      )
        .then(({ suggestions: candidates }) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setSuggestions(candidates);
          setShowSuggestions(candidates.length > 0);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setSuggestions([]);
          setShowSuggestions(false);
        });
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [inputValue, isStreaming]);

  const adjustTextareaHeight = () => {
    resizeFrameIdRef.current = null;
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const scheduleTextareaHeight = () => {
    if (resizeFrameIdRef.current !== null) {
      return;
    }
    resizeFrameIdRef.current = window.requestAnimationFrame(adjustTextareaHeight);
  };

  const resetTextareaHeight = () => {
    if (resizeFrameIdRef.current !== null) {
      window.cancelAnimationFrame(resizeFrameIdRef.current);
      resizeFrameIdRef.current = null;
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  useEffect(() => {
    return () => {
      if (resizeFrameIdRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameIdRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (lastSelectedSuggestionRef.current !== null && value !== lastSelectedSuggestionRef.current) {
      lastSelectedSuggestionRef.current = null;
    }
    setInputValue(value);
    scheduleTextareaHeight();
  };

  const handleSuggestionClick = (suggestion: string) => {
    lastSelectedSuggestionRef.current = suggestion;
    setInputValue(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    scheduleTextareaHeight();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isStreaming) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
      lastSelectedSuggestionRef.current = null;
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
                {highlightMatchByQuery(suggestion, inputValue)}
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
