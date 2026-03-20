import { ChangeEvent, FormEvent, useCallback, useState } from "react";

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
  const [submitError, setSubmitError] = useState<string | undefined>();

  const errors = validate(values);
  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setTouched({ username: true, name: true, password: true });
      if (hasErrors) return;
      setSubmitting(true);
      setSubmitError(undefined);
      try {
        await onSubmit(values);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setSubmitError(err.message);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [values, hasErrors, onSubmit],
  );

  const toggleType = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      type: prev.type === "signin" ? "signup" : "signin",
    }));
    setTouched({});
    setSubmitError(undefined);
  }, []);

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 className="text-center text-2xl font-bold">
        {values.type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button className="text-cax-brand underline" onClick={toggleType} type="button">
          {values.type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <FormInputField
          label="ユーザー名"
          name="username"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
          error={touched.username ? errors.username : undefined}
        />

        {values.type === "signup" && (
          <FormInputField
            label="名前"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="nickname"
            error={touched.name ? errors.name : undefined}
          />
        )}

        <FormInputField
          label="パスワード"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete={values.type === "signup" ? "new-password" : "current-password"}
          error={touched.password ? errors.password : undefined}
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
