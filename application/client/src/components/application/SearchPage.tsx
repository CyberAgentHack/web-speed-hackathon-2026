import { useEffect, useMemo, useState } from "react";
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
  query: string;
  results: Models.Post[];
}

interface SearchInputProps {
  forcedError?: string;
  clearForcedError?: () => void;
  showValidationError?: boolean;
}

const SearchInput = ({
  input,
  meta,
  forcedError,
  clearForcedError,
  showValidationError = false,
}: WrappedFieldProps & SearchInputProps) => {
  const metaError = meta.error && (meta.touched || showValidationError) ? meta.error : undefined;
  const errorMessage = forcedError || metaError;

  return (
    <div className="flex flex-1 flex-col">
      <input
        {...input}
        aria-label="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
        className={`flex-1 rounded border px-4 py-2 focus:outline-none ${
          errorMessage
            ? "border-cax-danger focus:border-cax-danger"
            : "border-cax-border focus:border-cax-brand-strong"
        }`}
        onChange={(event) => {
          clearForcedError?.();
          input.onChange(event);
        }}
        placeholder="検索 (例: キーワード since:2025-01-01 until:2025-12-31)"
        type="text"
      />
      {errorMessage && <span className="text-cax-danger mt-1 text-xs">{errorMessage}</span>}
    </div>
  );
};

const SearchPageComponent = ({
  query,
  results,
  handleSubmit,
}: Props & InjectedFormProps<SearchFormData, Props>) => {
  const navigate = useNavigate();
  const [isNegative, setIsNegative] = useState(false);
  const [forcedError, setForcedError] = useState<string>();
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const parsed = parseSearchQuery(query);

  useEffect(() => {
    if (!parsed.keywords) {
      setIsNegative(false);
      return;
    }

    let isMounted = true;
    const execute = () => {
      import("@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer")
        .then(({ analyzeSentiment }) => analyzeSentiment(parsed.keywords))
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
    };

    const idleCallbackId =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(() => {
            execute();
          })
        : null;
    const timeoutId =
      idleCallbackId == null
        ? window.setTimeout(() => {
            execute();
          }, 0)
        : null;

    return () => {
      isMounted = false;
      if (idleCallbackId != null) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
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

  const onSubmit = (values: SearchFormData) => {
    const sanitizedText = sanitizeSearchText(values.searchText.trim());
    navigate(`/search?q=${encodeURIComponent(sanitizedText)}`);
  };

  return (
    <div className="search-page flex flex-col gap-4">
      <div className="search-page__form bg-cax-surface p-4 shadow">
        <form
          onSubmit={(event) => {
            setHasTriedSubmit(true);
            const formData = new FormData(event.currentTarget);
            const validationErrors = validate({
              searchText: String(formData.get("searchText") ?? ""),
            });
            if (validationErrors.searchText) {
              event.preventDefault();
              setForcedError(validationErrors.searchText);
              return;
            }

            setForcedError(undefined);
            void handleSubmit(onSubmit)(event);
          }}
        >
          <div className="flex gap-2">
            <Field
              clearForcedError={() => setForcedError(undefined)}
              name="searchText"
              component={SearchInput}
              forcedError={forcedError}
              showValidationError={hasTriedSubmit}
            />
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
