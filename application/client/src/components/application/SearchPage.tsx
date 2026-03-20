import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import {
  parseSearchQuery,
  sanitizeSearchText,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { validate } from "@web-speed-hackathon-2026/client/src/search/validation";
import { analyzeSentiment } from "@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer";

import { Button } from "../foundation/Button";

interface Props {
  query: string;
  results: Models.Post[];
}

export const SearchPage = ({ query, results }: Props) => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState(query);
  const [isNegative, setIsNegative] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [submitFailed, setSubmitFailed] = useState(false);

  useEffect(() => {
    setSearchText(query);
  }, [query]);

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

  const handleClick = () => {
    const errors = validate({ searchText });
    if (errors.searchText) {
      setSubmitError(errors.searchText);
      setSubmitFailed(true);
    } else {
      setSubmitError(undefined);
      setSubmitFailed(false);
      const sanitizedText = sanitizeSearchText(searchText.trim());
      navigate(`/search?q=${encodeURIComponent(sanitizedText)}`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleClick();
  };

  const hasError = submitFailed && submitError;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-cax-surface p-4 shadow">
        <form onSubmit={handleFormSubmit}>
          <div className="flex flex-1 flex-col">
            <div className="flex gap-2">
              <input
                name="searchText"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
                  hasError
                    ? "border-cax-danger focus:border-cax-danger"
                    : "border-cax-border focus:border-cax-brand-strong"
                }`}
                placeholder="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
                type="text"
              />
              <Button variant="primary" type="button" onClick={handleClick}>
                検索
              </Button>
            </div>
            {submitError && (
              <span className="text-cax-danger mt-1 text-xs">{submitError}</span>
            )}
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
