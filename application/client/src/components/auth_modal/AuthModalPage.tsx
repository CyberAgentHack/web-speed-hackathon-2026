import { FormEvent, useCallback, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<void>;
}

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const [values, setValues] = useState<AuthFormData>({
    type: "signin",
    username: "",
    name: "",
    password: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof AuthFormData, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AuthFormData, string>>>({});

  const isEmpty = !values.username.trim() || !values.password.trim() || (values.type === "signup" && !values.name.trim());

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleToggleType = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      type: prev.type === "signin" ? "signup" : "signin",
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      // Mark all fields as touched
      setTouched({ username: true, name: true, password: true });
      const currentErrors = validate(values);
      if (Object.keys(currentErrors).length > 0) {
        setFieldErrors(currentErrors);
        return;
      }
      setFieldErrors({});
      setSubmitting(true);
      setError(undefined);
      try {
        await onSubmit(values);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "_error" in err) {
          setError((err as { _error: string })._error);
        } else if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [values, onSubmit],
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
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors.username}
          touched={touched.username}
          label="ユーザー名"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="off"
        />

        {values.type === "signup" && (
          <FormInputField
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={fieldErrors.name}
            touched={touched.name}
            label="名前"
            autoComplete="off"
          />
        )}

        <FormInputField
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors.password}
          touched={touched.password}
          label="パスワード"
          autoComplete="off"
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

      <ModalSubmitButton disabled={submitting || isEmpty} loading={submitting}>
        {values.type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{error}</ModalErrorMessage>
    </form>
  );
};
