import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import {
  parseSearchQuery,
  sanitizeSearchText,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { validate } from "@web-speed-hackathon-2026/client/src/search/validation";

import { Button } from "../foundation/Button";

let analyzeSentimentModulePromise:
  | Promise<typeof import("@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer")>
  | null = null;

async function loadAnalyzeSentiment() {
  analyzeSentimentModulePromise ??= import(
    "@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer"
  );
  return analyzeSentimentModulePromise;
}

type SentimentStatus = "idle" | "loading" | "done";
type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

interface Props {
  query: string;
  results: Models.Post[];
}

export const SearchPage = ({ query, results }: Props) => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState(query);
  const [touched, setTouched] = useState(false);
  const [isNegative, setIsNegative] = useState(false);
  const [sentimentStatus, setSentimentStatus] = useState<SentimentStatus>("idle");
  const inputId = useId();

  useEffect(() => {
    setSearchText(query);
    setTouched(false);
  }, [query]);

  const errors = validate({ searchText });
  const error = errors.searchText;

  const parsed = parseSearchQuery(query);

  useEffect(() => {
    if (!parsed.keywords) {
      setIsNegative(false);
      setSentimentStatus("idle");
      return;
    }

    let isMounted = true;
    setSentimentStatus("loading");

    const runSentimentAnalysis = () => {
      void loadAnalyzeSentiment()
        .then(({ analyzeSentiment }) => analyzeSentiment(parsed.keywords))
        .then((result) => {
          if (isMounted) {
            setIsNegative(result.label === "negative");
            setSentimentStatus("done");
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsNegative(false);
            setSentimentStatus("done");
          }
        });
    };

    let timerId: number | null = null;
    let idleCallbackId: number | null = null;

    // 検索結果の描画を先に進めるため、低優先度で辞書ロードを開始する。
    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      idleCallbackId = idleWindow.requestIdleCallback(runSentimentAnalysis, { timeout: 1500 });
    } else {
      timerId = window.setTimeout(runSentimentAnalysis, 600);
    }

    return () => {
      isMounted = false;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      if (idleCallbackId !== null && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleCallbackId);
      }
    };
  }, [parsed.keywords]);

  const searchConditionText = useMemo(() => {
    const parts: string[] = [];
    if (parsed.keywords) {
      parts.push(`「${parsed.keywords}」`);
    }
    if (parsed.sinceDate) {
      parts.push(`${parsed.sinceDate} 以降`);
    }
    if (parsed.untilDate) {
      parts.push(`${parsed.untilDate} 以前`);
    }
    return parts.join(" ");
  }, [parsed]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    const sanitizedText = sanitizeSearchText(searchText.trim());
    navigate(`/search?q=${encodeURIComponent(sanitizedText)}`);
  };

  const showError = touched && error;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-cax-surface p-4 shadow">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col">
              <label className="sr-only" htmlFor={inputId}>
                検索 (例: キーワード since:2025-01-01 until:2025-12-31)
              </label>
              <input
                id={inputId}
                name="searchText"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onBlur={() => setTouched(true)}
                className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
                  showError
                    ? "border-cax-danger focus:border-cax-danger"
                    : "border-cax-border focus:border-cax-brand-strong"
                }`}
                placeholder="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
                type="text"
              />
              {showError && (
                <span className="text-cax-danger mt-1 text-xs">{error}</span>
              )}
            </div>
            <Button variant="primary" type="submit">
              検索
            </Button>
          </div>
        </form>
        <p className="text-cax-text-muted mt-2 text-xs">
          since:YYYY-MM-DD で開始日、until:YYYY-MM-DD で終了日を指定できます
        </p>
      </div>

      {query && (
        <div className="px-4">
          <h2 className="text-lg font-bold">
            {searchConditionText} の検索結果 ({results.length} 件)
          </h2>
        </div>
      )}

      {isNegative && (
        <article className="hover:bg-cax-surface-subtle px-1 sm:px-4">
          <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
            <div>
              <p className="text-cax-text text-lg font-bold">どしたん話聞こうか?</p>
              <p className="text-cax-text-muted">言わなくてもいいけど、言ってもいいよ。</p>
            </div>
          </div>
        </article>
      )}
      {sentimentStatus === "loading" && !isNegative && (
        <div className="text-cax-text-muted px-4 text-xs">感情分析を読み込み中...</div>
      )}

      {query && results.length === 0 ? (
        <div className="text-cax-text-muted flex items-center justify-center p-8">
          検索結果が見つかりませんでした
        </div>
      ) : (
        <Timeline timeline={results} />
      )}
    </div>
  );
};
