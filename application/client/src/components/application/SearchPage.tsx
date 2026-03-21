import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router";
import { Field, InjectedFormProps, reduxForm, WrappedFieldProps } from "redux-form";

import {
  parseSearchQuery,
  sanitizeSearchText,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { SearchFormData } from "@web-speed-hackathon-2026/client/src/search/types";
import { validate } from "@web-speed-hackathon-2026/client/src/search/validation";
import { analyzeSentiment } from "@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer";

import { MeaningfulPaintHeader } from "../foundation/MeaningfulPaintHeader";
import { Button } from "../foundation/Button";

const SEARCH_FIELD_LABEL =
  "検索 (例: キーワード since:2025-01-01 until:2025-12-31)";

interface Props {
  query: string;
  results: Models.Post[];
  isLoading: boolean;
}

const SearchInput = ({ input, meta }: WrappedFieldProps) => (
  <div className="flex flex-1 flex-col">
    <input
      {...input}
      aria-label={SEARCH_FIELD_LABEL}
      className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
        meta.touched && meta.error
          ? "border-cax-danger focus:border-cax-danger"
          : "border-cax-border focus:border-cax-brand-strong"
      }`}
      placeholder={SEARCH_FIELD_LABEL}
      type="text"
    />
    {meta.touched && meta.error && (
      <span className="text-cax-danger mt-1 text-xs">{meta.error}</span>
    )}
  </div>
);

const SearchPageComponent = ({
  query,
  results,
  isLoading,
  handleSubmit,
}: Props & InjectedFormProps<SearchFormData, Props>) => {
  const navigate = useNavigate();
  const [isNegative, setIsNegative] = useState(false);

  const parsed = parseSearchQuery(query);

  useEffect(() => {
    if (!parsed.keywords) {
      setIsNegative(false);
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      void analyzeSentiment(parsed.keywords)
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
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
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

  const onSubmit = (values: SearchFormData) => {
    const sanitizedText = sanitizeSearchText(values.searchText.trim());
    const path = `/search?q=${encodeURIComponent(sanitizedText)}`;
    flushSync(() => {
      navigate(path);
    });
    void Promise.resolve();
  };

  return (
    <div className="flex flex-col gap-4">
      <MeaningfulPaintHeader title="検索" />
      <div className="bg-cax-surface p-4 shadow">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex gap-2">
            <Field name="searchText" component={SearchInput} />
            <Button variant="primary" type="submit">
              検索
            </Button>
          </div>
        </form>
        <p className="text-cax-text-muted mt-2 text-xs">
          since:YYYY-MM-DD で開始日、until:YYYY-MM-DD で終了日を指定できます
        </p>
      </div>

      {query !== "" && (
        <div className="px-4">
          <h2 className="text-lg font-bold">
            {searchConditionText} の検索結果 ({isLoading ? "…" : results.length} 件)
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

      {query !== "" ? (
        <>
          {isLoading ? (
            <p aria-busy="true" className="text-cax-text-muted px-4 py-8 text-center">
              読込中...
            </p>
          ) : null}
          <ul className="px-1 sm:px-4">
            {results.map((post) => (
              <li key={post.id}>
                <article>
                  <p>{post.text}</p>
                </article>
              </li>
            ))}
          </ul>
          {!isLoading && results.length === 0 ? (
            <p className="text-cax-text-muted px-4 py-8 text-center">検索結果が見つかりませんでした</p>
          ) : null}
        </>
      ) : null}

      {query === "" ? (
        <p className="text-cax-text-muted px-4 py-6 text-sm">キーワードを入力して検索できます</p>
      ) : null}
    </div>
  );
};

export const SearchPage = reduxForm<SearchFormData, Props>({
  form: "search",
  enableReinitialize: true,
  validate,
})(SearchPageComponent);
