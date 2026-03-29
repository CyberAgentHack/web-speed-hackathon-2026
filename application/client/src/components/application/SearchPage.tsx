/**
 * 検索ページコンポーネント。
 * redux-formを排除し、useState + onSubmitで検索フォームを管理する。
 * Playwrightのaria-label検出とpressSequentially入力の安定性を確保するため、
 * 非制御コンポーネントとして実装。
 */
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import {
  parseSearchQuery,
  sanitizeSearchText,
  isValidDate,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { analyzeSentiment } from "@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer";

import { Button } from "../foundation/Button";

interface Props {
  query: string;
  results: Models.Post[];
}

export const SearchPage = ({ query, results }: Props) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNegative, setIsNegative] = useState(false);

  const parsed = parseSearchQuery(query);

  useEffect(() => {
    if (!parsed.keywords) {
      setIsNegative(false);
      return;
    }

    let isMounted = true;
    analyzeSentiment(parsed.keywords)
      .then((result) => {
        if (isMounted) {
          setIsNegative(result.label === "negative");
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsNegative(false);
        }
      });

    return () => {
      isMounted = false;
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

  /** フォーム送信時にバリデーション→ナビゲーション */
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const raw = inputRef.current?.value.trim() || "";

      if (!raw) {
        setError("検索キーワードを入力してください");
        return;
      }

      const { keywords, sinceDate, untilDate } = parseSearchQuery(raw);

      if (!keywords && !sinceDate && !untilDate) {
        setError("検索キーワードまたは日付範囲を指定してください");
        return;
      }
      if (sinceDate && !isValidDate(sinceDate)) {
        setError(`since: の日付形式が不正です: ${sinceDate}`);
        return;
      }
      if (untilDate && !isValidDate(untilDate)) {
        setError(`until: の日付形式が不正です: ${untilDate}`);
        return;
      }
      if (sinceDate && untilDate && new Date(sinceDate) > new Date(untilDate)) {
        setError("since: は until: より前の日付を指定してください");
        return;
      }

      setError(null);
      const sanitizedText = sanitizeSearchText(raw);
      navigate(`/search?q=${encodeURIComponent(sanitizedText)}`);
    },
    [navigate],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-cax-surface p-4 shadow">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col">
              <input
                ref={inputRef}
                aria-label="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
                className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
                  error
                    ? "border-cax-danger focus:border-cax-danger"
                    : "border-cax-border focus:border-cax-brand-strong"
                }`}
                defaultValue={query}
                placeholder="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
                type="text"
              />
              {error && <span className="text-cax-danger mt-1 text-xs">{error}</span>}
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
