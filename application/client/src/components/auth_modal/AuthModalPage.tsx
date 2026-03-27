import { useId, useMemo, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<void>;
}

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const usernameInputId = useId();
  const nameInputId = useId();
  const passwordInputId = useId();
  const [values, setValues] = useState<AuthFormData>({
    type: "signin",
    username: "",
    name: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AuthFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const type = values.type;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      const message = error instanceof Error ? error.message : "認証に失敗しました";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validationErrors = useMemo(() => validate(values), [values]);
  const invalid = Object.keys(validationErrors).length > 0;

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={() =>
            setValues((prev) => ({
              ...prev,
              type: prev.type === "signin" ? "signup" : "signin",
            }))
          }
          type="button"
        >
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <div className="flex flex-col gap-y-1">
          <label className="block text-sm" htmlFor={usernameInputId}>
            ユーザー名
          </label>
          <Input
            autoComplete="username"
            id={usernameInputId}
            leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
            value={values.username}
            onChange={(event) => {
              setValues((prev) => ({ ...prev, username: event.target.value }));
              setErrors((prev) => ({ ...prev, username: undefined }));
            }}
          />
          {errors.username != null && (
            <span className="text-cax-danger text-xs">{errors.username}</span>
          )}
        </div>

        {type === "signup" && (
          <div className="flex flex-col gap-y-1">
            <label className="block text-sm" htmlFor={nameInputId}>
              名前
            </label>
            <Input
              autoComplete="nickname"
              id={nameInputId}
              value={values.name}
              onChange={(event) => {
                setValues((prev) => ({ ...prev, name: event.target.value }));
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
            />
            {errors.name != null && <span className="text-cax-danger text-xs">{errors.name}</span>}
          </div>
        )}

        <div className="flex flex-col gap-y-1">
          <label className="block text-sm" htmlFor={passwordInputId}>
            パスワード
          </label>
          <Input
            autoComplete={type === "signup" ? "new-password" : "current-password"}
            id={passwordInputId}
            type="password"
            value={values.password}
            onChange={(event) => {
              setValues((prev) => ({ ...prev, password: event.target.value }));
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
          />
          {errors.password != null && (
            <span className="text-cax-danger text-xs">{errors.password}</span>
          )}
        </div>
      </div>

      {type === "signup" ? (
        <p>
          <Link className="text-cax-brand underline" onClick={onRequestCloseModal} to="/terms">
            利用規約
          </Link>
          に同意して
        </p>
      ) : null}

      <ModalSubmitButton disabled={isSubmitting || invalid} loading={isSubmitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
