import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Field, InjectedFormProps, reduxForm, WrappedFieldProps } from "redux-form";

import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import {
  parseSearchQuery,
  sanitizeSearchText,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { SearchFormData } from "@web-speed-hackathon-2026/client/src/search/types";
import { validate } from "@web-speed-hackathon-2026/client/src/search/validation";

import { Button } from "../foundation/Button";

interface Props {
  isNegative: boolean;
  query: string;
  results: Models.Post[];
}

interface SearchInputProps extends WrappedFieldProps {
  showSubmitError?: boolean;
}

const SearchInput = ({ input, meta, showSubmitError = false }: SearchInputProps) => {
  const fallbackError = showSubmitError ? validate({ searchText: String(input.value ?? "") }).searchText : undefined;
  const errorMessage = meta.error ?? fallbackError;
  const showError = Boolean(errorMessage) && (meta.touched || showSubmitError);

  return (
    <div className="flex flex-1 flex-col">
      <input
        {...input}
        aria-label="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
        className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
          showError
            ? "border-cax-danger focus:border-cax-danger"
            : "border-cax-border focus:border-cax-brand-strong"
        }`}
        placeholder="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
        type="text"
      />
    </div>
  );
};

const SearchPageComponent = ({
  isNegative,
  query,
  results,
}: Props & InjectedFormProps<SearchFormData, Props>) => {
  const navigate = useNavigate();
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
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

  const onSubmit = (values: SearchFormData) => {
    setHasAttemptedSubmit(false);
    setSubmitErrorMessage(null);
    const sanitizedText = sanitizeSearchText(values.searchText.trim());
    navigate(`/search?q=${encodeURIComponent(sanitizedText)}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-cax-surface p-4 shadow">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setHasAttemptedSubmit(true);
            const formData = new FormData(event.currentTarget);
            const searchText = String(formData.get("searchText") ?? "");
            const nextError = validate({ searchText }).searchText;
            setSubmitErrorMessage(typeof nextError === "string" ? nextError : null);
            if (typeof nextError === "string") {
              return;
            }
            onSubmit({ searchText });
          }}
        >
          <div className="flex gap-2">
            <Field name="searchText" component={SearchInput} showSubmitError={hasAttemptedSubmit} />
            <Button variant="primary" type="submit">
              検索
            </Button>
          </div>
        </form>
        {submitErrorMessage && <p className="text-cax-danger mt-2 text-xs">{submitErrorMessage}</p>}
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
