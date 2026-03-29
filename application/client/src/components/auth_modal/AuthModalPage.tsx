import { ChangeEventHandler, FormEventHandler, useCallback, useMemo, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AuthFormErrors, validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<void>;
}

/**
 * サインイン/新規登録フォーム。
 * Redux/redux-formを排除し、React stateのみで状態管理する。
 * これによりvendorバンドルからRedux関連を除去し、TBT/バンドルサイズを改善する。
 */
export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const [values, setValues] = useState<AuthFormData>({
    type: "signin",
    username: "",
    name: "",
    password: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof AuthFormData, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors: AuthFormErrors = useMemo(() => validate(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((ev) => {
    const { name, value } = ev.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setSubmitError(null);
  }, []);

  const handleBlur = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleToggleType = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      type: prev.type === "signin" ? "signup" : "signin",
    }));
    setTouched({});
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    async (ev) => {
      ev.preventDefault();
      // 全フィールドをtouched状態にする
      setTouched({ username: true, name: true, password: true });
      if (hasErrors) return;

      setSubmitting(true);
      try {
        await onSubmit(values);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "エラーが発生しました";
        setSubmitError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [values, hasErrors, onSubmit],
  );

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 className="text-center text-2xl font-bold">
        {values.type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={handleToggleType}
          type="button"
        >
          {values.type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <FormInputField
          name="username"
          label="ユーザー名"
          value={values.username}
          error={errors.username}
          touched={touched.username}
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
          autoFocus
          onChange={handleChange}
          onBlur={() => handleBlur("username")}
        />

        {values.type === "signup" && (
          <FormInputField
            name="name"
            label="名前"
            value={values.name}
            error={errors.name}
            touched={touched.name}
            autoComplete="nickname"
            onChange={handleChange}
            onBlur={() => handleBlur("name")}
          />
        )}

        <FormInputField
          name="password"
          label="パスワード"
          value={values.password}
          error={errors.password}
          touched={touched.password}
          type="password"
          autoComplete={values.type === "signup" ? "new-password" : "current-password"}
          onChange={handleChange}
          onBlur={() => handleBlur("password")}
        />
      </div>

      {values.type === "signup" ? (
        <p>
          <Link className="text-cax-brand underline" onClick={onRequestCloseModal} to="/terms">
            利用規約
          </Link>
          に同意して
        </p>
      ) : null}

      <ModalSubmitButton disabled={submitting || hasErrors} loading={submitting}>
        {values.type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
