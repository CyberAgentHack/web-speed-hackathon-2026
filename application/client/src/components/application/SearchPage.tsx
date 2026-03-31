import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Field,
  InjectedFormProps,
  reduxForm,
  SubmissionError,
  WrappedFieldProps,
} from "redux-form";

import { Timeline } from "@web-speed-hackathon-2026/client/src/components/timeline/Timeline";
import {
  parseSearchQuery,
  sanitizeSearchText,
} from "@web-speed-hackathon-2026/client/src/search/services";
import { SearchFormData } from "@web-speed-hackathon-2026/client/src/search/types";
import { validate as validateSearchForm } from "@web-speed-hackathon-2026/client/src/search/validation";

import { Button } from "../foundation/Button";

interface Props {
  query: string;
  results: Models.Post[];
}

type SentimentLabel = "positive" | "negative" | "neutral";

const SearchInput = ({ input, meta }: WrappedFieldProps) => {
  const showError = (meta.touched || meta.submitFailed) && meta.error;

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
      {showError && <span className="text-cax-danger mt-1 text-xs">{meta.error}</span>}
    </div>
  );
};

const SearchPageComponent = ({
  query,
  results,
  handleSubmit,
}: Props & InjectedFormProps<SearchFormData, Props>) => {
  const navigate = useNavigate();

  const parsed = parseSearchQuery(query);
  const [sentimentLabel, setSentimentLabel] = useState<SentimentLabel>("neutral");

  useEffect(() => {
    let active = true;

    if (!parsed.keywords) {
      setSentimentLabel("neutral");
      return;
    }

    void import("@web-speed-hackathon-2026/client/src/utils/negaposi_analyzer")
      .then(({ analyzeSentiment }) => analyzeSentiment(parsed.keywords))
      .then((result) => {
        if (active) {
          setSentimentLabel(result.label);
        }
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          setSentimentLabel("neutral");
        }
      });

    return () => {
      active = false;
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
    const errors = validateSearchForm(values);
    if (errors.searchText) {
      throw new SubmissionError(errors);
    }

    const sanitizedText = sanitizeSearchText(values.searchText.trim());
    navigate(`/search?q=${encodeURIComponent(sanitizedText)}`);
  };

  return (
    <div className="flex flex-col gap-4">
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

      {query && (
        <div className="px-4">
          <h2 className="text-lg font-bold">
            {searchConditionText} の検索結果 ({results.length} 件)
          </h2>
        </div>
      )}

      {query && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          {sentimentLabel === "negative" ? (
            <>
              <p className="text-cax-brand text-xl font-bold">どしたん話聞こうか?</p>
              <p className="text-cax-text-muted text-sm">
                言わなくてもいいけど、言ってもいいよ。
              </p>
            </>
          ) : null}
          <p className="text-cax-text-muted">検索結果が見つかりませんでした</p>
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
  validate: validateSearchForm,
})(SearchPageComponent);
