import { FormEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Field, InjectedFormProps, reduxForm, WrappedFieldProps } from "redux-form";

import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import {
  parseSearchQuery,
  sanitizeSearchText,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { SearchFormData } from "@web-speed-hackathon-2026/client/src/search/types";
import { validate } from "@web-speed-hackathon-2026/client/src/search/validation";
import { analyzeSentiment } from "@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer";

import { Button } from "../foundation/Button";

const SEARCH_INPUT_LABEL = "検索 (例: キーワード since:2025-01-01 until:2025-12-31)";

interface Props {
  query: string;
  results: Models.Post[];
}

const SearchInput = ({ input, meta, extraError }: WrappedFieldProps & { extraError?: string }) => {
  const error = meta.error || extraError;
  const showError = (meta.touched || extraError) && error;
  return (
    <div className="flex flex-1 flex-col">
      <input
        {...input}
        aria-label={SEARCH_INPUT_LABEL}
        className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
          showError
            ? "border-cax-danger focus:border-cax-danger"
            : "border-cax-border focus:border-cax-brand-strong"
        }`}
        placeholder={SEARCH_INPUT_LABEL}
        type="text"
      />
      {showError && (
        <span className="text-cax-danger mt-1 text-xs">{error}</span>
      )}
    </div>
  );
};

const SearchPageComponent = ({
  query,
  results,
}: Props & InjectedFormProps<SearchFormData, Props>) => {
  const navigate = useNavigate();
  const [isNegative, setIsNegative] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

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
      parts.push(`「${parsed.keywords}」を含むテキスト`);
    }
    if (parsed.sinceDate) {
      parts.push(`${parsed.sinceDate} 以降`);
    }
    if (parsed.untilDate) {
      parts.push(`${parsed.untilDate} 以前`);
    }
    return parts.join(" ");
  }, [parsed]);

  // React 19 removes UNSAFE_componentWillReceiveProps, breaking redux-form's
  // built-in validation (syncErrors never computed). Validate manually on submit.
  const onFormSubmit = useCallback<FormEventHandler<HTMLFormElement>>((ev) => {
    ev.preventDefault();
    const input = ev.currentTarget.querySelector<HTMLInputElement>("input[name='searchText']");
    const currentValue = input?.value ?? "";
    const errors = validate({ searchText: currentValue });
    if (typeof errors.searchText === "string") {
      setSubmitError(errors.searchText);
      return;
    }
    setSubmitError(undefined);
    const sanitizedText = sanitizeSearchText(currentValue.trim());
    navigate(`/search?q=${encodeURIComponent(sanitizedText)}`);
  }, [navigate]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-cax-surface p-4 shadow">
        <form onSubmit={onFormSubmit}>
          <div className="flex gap-2">
            <Field name="searchText" component={SearchInput} extraError={submitError} />
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

export const SearchPage = reduxForm<SearchFormData, Props>({
  form: "search",
  enableReinitialize: true,
  validate,
})(SearchPageComponent);
