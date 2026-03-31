import { FormEvent, useCallback, useMemo, useState } from "react";

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => validate(values), [values]);
  const invalid = Object.keys(errors).length > 0;

  const handleChange = useCallback((name: keyof AuthFormData, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("username", e.target.value), [handleChange]);
  const handleUsernameBlur = useCallback(() => handleBlur("username"), [handleBlur]);
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("name", e.target.value), [handleChange]);
  const handleNameBlur = useCallback(() => handleBlur("name"), [handleBlur]);
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleChange("password", e.target.value), [handleChange]);
  const handlePasswordBlur = useCallback(() => handleBlur("password"), [handleBlur]);

  const handleToggleType = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      type: prev.type === "signin" ? "signup" : "signin",
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setSubmitError(null);
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
    [onSubmit, values],
  );

  const type = values.type;

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={handleToggleType}
          type="button"
        >
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <FormInputField
          name="username"
          label="ユーザー名"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
          value={values.username}
          onChange={handleUsernameChange}
          onBlur={handleUsernameBlur}
          error={errors["username"]}
          touched={touched["username"]}
        />

        {type === "signup" && (
          <FormInputField
            name="name"
            label="名前"
            autoComplete="nickname"
            value={values.name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            error={errors["name"]}
            touched={touched["name"]}
          />
        )}

        <FormInputField
          name="password"
          label="パスワード"
          type="password"
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          value={values.password}
          onChange={handlePasswordChange}
          onBlur={handlePasswordBlur}
          error={errors["password"]}
          touched={touched["password"]}
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

      <ModalSubmitButton disabled={submitting || invalid} loading={submitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
