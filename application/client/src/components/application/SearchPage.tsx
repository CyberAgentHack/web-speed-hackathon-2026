import {
  ChangeEventHandler,
  FormEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import {
  parseSearchQuery,
  sanitizeSearchText,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { validate } from "@web-speed-hackathon-2026/client/src/search/validation";
import { Button } from "../foundation/Button";

interface Props {
  isNegative: boolean;
  onSearch: (query: string) => void;
  query: string;
  results: Models.Post[];
}

export const SearchPage = ({ isNegative, onSearch, query, results }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (inputRef.current !== null && inputRef.current.value !== query) {
      inputRef.current.value = query;
    }
    setSearchError(null);
  }, [query]);
  const parsed = parseSearchQuery(query);

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

  const handleChange: ChangeEventHandler<HTMLInputElement> = () => {
    if (searchError !== null) {
      setSearchError(null);
    }
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const submittedSearchText = inputRef.current?.value ?? "";
    const errors = validate({ searchText: submittedSearchText });
    if (errors.searchText) {
      setSearchError(errors.searchText);
      return;
    }

    const sanitizedText = sanitizeSearchText(submittedSearchText.trim());
    if (inputRef.current !== null) {
      inputRef.current.value = sanitizedText;
    }
    onSearch(sanitizedText);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-cax-surface p-4 shadow">
        <form action="/search" method="get" onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col">
              <input
                aria-label="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
                aria-describedby={searchError !== null ? "search-error" : undefined}
                aria-invalid={searchError !== null || undefined}
                className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
                  searchError !== null
                    ? "border-cax-danger focus:border-cax-danger"
                    : "border-cax-border focus:border-cax-brand-strong"
                }`}
                name="q"
                onChange={handleChange}
                placeholder="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
                ref={inputRef}
                type="text"
                defaultValue={query}
              />
              {searchError !== null && (
                <span className="text-cax-danger mt-1 text-xs" id="search-error">
                  {searchError}
                </span>
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
