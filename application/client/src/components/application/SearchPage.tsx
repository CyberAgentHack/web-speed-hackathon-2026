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
  totalCount: number;
}

const SearchInput = ({
  value,
  onChange,
  errorMessage,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  errorMessage?: string;
}) => (
  <div className="flex flex-1 flex-col">
    <input
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
        errorMessage
          ? "border-cax-danger focus:border-cax-danger"
          : "border-cax-border focus:border-cax-brand-strong"
      }`}
      name="searchText"
      placeholder="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
      type="text"
    />
    {errorMessage && <span className="text-cax-danger mt-1 text-xs">{errorMessage}</span>}
  </div>
);

const SearchForm = ({ query }: Pick<Props, "query">) => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState(query);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleAction = (formData: FormData) => {
    const nextSearchText = String(formData.get("searchText") ?? "");
    const validationErrors = validate({ searchText: nextSearchText });

    if (validationErrors.searchText) {
      setErrorMessage(validationErrors.searchText);
      return;
    }

    setErrorMessage(undefined);
    const sanitizedText = sanitizeSearchText(nextSearchText.trim());
    navigate(`/search?q=${encodeURIComponent(sanitizedText)}`);
  };

  return (
    <form action={handleAction} className="flex gap-2">
      <SearchInput
        value={searchText}
        onChange={(nextValue) => {
          setSearchText(nextValue);
          setErrorMessage(undefined);
        }}
        errorMessage={errorMessage}
      />
      <Button variant="primary" type="submit">
        検索
      </Button>
    </form>
  );
};

export const SearchPage = ({ query, results, totalCount }: Props) => {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-cax-surface p-4 shadow">
        <SearchForm key={query} query={query} />
        <p className="text-cax-text-muted mt-2 text-xs">
          since:YYYY-MM-DD で開始日、until:YYYY-MM-DD で終了日を指定できます
        </p>
      </div>

      {query && (
        <div className="px-4">
          <h2 className="text-lg font-bold">
            {searchConditionText} の検索結果 ({totalCount} 件)
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
