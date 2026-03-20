import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import {
  parseSearchQuery,
  sanitizeSearchText,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { validate } from "@web-speed-hackathon-2026/client/src/search/validation";

import { Button } from "../foundation/Button";

interface Props {
  query: string;
  results: Models.Post[];
}

const SearchInput = ({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex flex-1 flex-col">
    <label className="sr-only" htmlFor="search-query-input">
      検索 (例: キーワード since:2025-01-01 until:2025-12-31)
    </label>
    <input
      aria-label="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
      className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
        error
          ? "border-cax-danger focus:border-cax-danger"
          : "border-cax-border focus:border-cax-brand-strong"
      }`}
      id="search-query-input"
      onChange={(ev) => onChange(ev.currentTarget.value)}
      placeholder="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
      type="text"
      value={value}
    />
    {error ? <span className="text-cax-danger mt-1 text-xs">{error}</span> : null}
  </div>
);

export const SearchPage = ({ query, results }: Props) => {
  const navigate = useNavigate();
  const [isNegative, setIsNegative] = useState(false);
  const [searchText, setSearchText] = useState(query);

  useEffect(() => {
    setSearchText(query);
  }, [query]);

  const parsed = parseSearchQuery(query);
  const keywords = parsed.keywords;
  const errors = useMemo(() => validate({ searchText }), [searchText]);
  const error = errors.searchText;

  useEffect(() => {
    if (!keywords) {
      setIsNegative(false);
      return;
    }

    let isMounted = true;
    void import("@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer")
      .then(({ analyzeSentiment }) => analyzeSentiment(keywords))
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
  }, [keywords]);

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

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (error) {
      return;
    }

    const sanitizedText = sanitizeSearchText(searchText.trim());
    navigate(`/search?q=${encodeURIComponent(sanitizedText)}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-cax-surface p-4 shadow">
        <form onSubmit={onSubmit}>
          <div className="flex gap-2">
            <SearchInput error={error} onChange={setSearchText} value={searchText} />
            <Button variant="primary" type="submit" disabled={!!error}>
              検索
            </Button>
          </div>
        </form>
        <p className="text-cax-text-muted mt-2 text-xs">
          since:YYYY-MM-DD で開始日、until:YYYY-MM-DD で終了日を指定できます
        </p>
      </div>

      {query ? (
        <div className="px-4">
          <h2
            aria-label={`${searchConditionText} の検索結果`}
            className="text-lg font-bold"
            tabIndex={-1}
          >
            {searchConditionText} の検索結果 ({results.length} 件)
          </h2>
        </div>
      ) : null}

      {isNegative ? (
        <article className="hover:bg-cax-surface-subtle px-1 sm:px-4">
          <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
            <div>
              <p className="text-cax-text text-lg font-bold">どしたん話聞こうか?</p>
              <p className="text-cax-text-muted">言わなくてもいいけど、言ってもいいよ。</p>
            </div>
          </div>
        </article>
      ) : null}

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
