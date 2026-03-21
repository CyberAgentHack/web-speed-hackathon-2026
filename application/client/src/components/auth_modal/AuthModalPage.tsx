import { ChangeEvent, FormEvent, useCallback, useRef, useState } from "react";

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
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<"signin" | "signup">("signin");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AuthFormData, string>>>({});
  const [fieldValues, setFieldValues] = useState({ username: "", name: "", password: "" });

  const getFormValues = useCallback((): AuthFormData => {
    return {
      type,
      username: fieldValues.username,
      name: fieldValues.name,
      password: fieldValues.password,
    };
  }, [type, fieldValues]);

  const handleFieldChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const newValues = { ...fieldValues, [name]: value };
      setFieldValues(newValues);
      const errors = validate({ type, ...newValues });
      setFieldErrors(errors);
    },
    [type, fieldValues],
  );

  const isFormValid = Object.keys(validate(getFormValues())).length === 0;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const values = getFormValues();
      const errors = validate(values);
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) return;

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
    [getFormValues, onSubmit],
  );

  const toggleType = useCallback(() => {
    setType((prev) => (prev === "signin" ? "signup" : "signin"));
    setFieldErrors({});
    setSubmitError(undefined);
  }, []);

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit} ref={formRef}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button className="text-cax-brand underline" onClick={toggleType} type="button">
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <FormInputField
          label="ユーザー名"
          name="username"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
          error={fieldErrors.username}
          onChange={handleFieldChange}
        />

        {type === "signup" && (
          <FormInputField
            label="名前"
            name="name"
            autoComplete="nickname"
            error={fieldErrors.name}
            onChange={handleFieldChange}
          />
        )}

        <FormInputField
          label="パスワード"
          name="password"
          type="password"
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          error={fieldErrors.password}
          onChange={handleFieldChange}
        />
      </div>

      {type === "signup" ? (
        <p>
          <Link className="text-cax-brand underline" onClick={onRequestCloseModal} to="/terms">
            利用規約
          </Link>
          に同意して
        </p>
      ) : null}

      <ModalSubmitButton disabled={submitting || !isFormValid} loading={submitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
