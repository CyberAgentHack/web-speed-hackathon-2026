import Bluebird from "bluebird";
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
import {
  extractTokens,
  filterSuggestionsBM25,
} from "@web-speed-hackathon-2026/client/src/utils/bm25_search";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
}

/**
 * サジェスト内のトークンに一致する部分をハイライトします
 */
const highlightMatchByTokens = (text: string, tokens: string[]) => {
  if (tokens.length === 0) return text;

  // トークンを長い順にソートして、正規表現でのマッチングを確実にする
  const sortedTokens = [...tokens].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sortedTokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) => (
        pattern.test(part) ? (
          <span key={i} className="text-cax-brand font-bold bg-cax-highlight/30">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      ))}
    </>
  );
};

export const ChatInput = ({ isStreaming, onSendMessage }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [tokenizer, setTokenizer] = useState<any | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [queryTokens, setQueryTokens] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // サジェストが更新されたら一番下にスクロール
  useLayoutEffect(() => {
    if (suggestionsRef.current && showSuggestions) {
      suggestionsRef.current.scrollTop = suggestionsRef.current.scrollHeight;
    }
  }, [suggestions, showSuggestions]);

  // 初回にkuromojiトークナイザーを構築
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { default: kuromoji } = await import("kuromoji");
      const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
      const nextTokenizer = await (builder as any).buildAsync();
      if (mounted) {
        setTokenizer(nextTokenizer);
      }
    };
    init();

    return () => {
      mounted = false;
    };
  }, []);

  const [candidates, setCandidates] = useState<string[]>([]);

  // 初回に candidates を取得
  useEffect(() => {
    const fetchCandidates = async () => {
      const { suggestions: data } = await fetchJSON<{ suggestions: string[] }>(
        "/api/v1/crok/suggestions",
      );
      setCandidates(data);
    };
    fetchCandidates();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const updateSuggestions = async () => {
      if (!tokenizer || !inputValue.trim() || candidates.length === 0) {
        setSuggestions([]);
        setQueryTokens([]);
        setShowSuggestions(false);
        return;
      }

      // デバウンス的な待ちを入れる
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (cancelled) return;

      const tokens = extractTokens(tokenizer.tokenize(inputValue));
      const results = await filterSuggestionsBM25(tokenizer, candidates, tokens);

      if (cancelled) {
        return;
      }

      setQueryTokens(tokens);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    };
    void updateSuggestions();

    return () => {
      cancelled = true;
    };
  }, [inputValue, tokenizer, candidates]);

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
    setQueryTokens([]);
    setShowSuggestions(false);
  };

  const sendCurrentMessage = () => {
    if (inputValue.trim() && !isStreaming) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      setSuggestions([]);
      setQueryTokens([]);
      setShowSuggestions(false);
      resetTextareaHeight();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendCurrentMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendCurrentMessage();
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
                {highlightMatchByTokens(suggestion, queryTokens)}
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
