import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onSubmit: (values: AuthFormData) => Promise<string | null>;
}

interface FormErrors {
  username?: string;
  password?: string;
  name?: string;
  agreed?: string;
}

function validateForm(values: AuthFormData): FormErrors {
  const errors: FormErrors = {};
  const username = values.username?.trim() ?? "";
  const password = values.password?.trim() ?? "";
  const name = values.name?.trim() ?? "";

  if (username.length === 0) errors.username = "ユーザー名を入力してください";
  else if (!/^[a-zA-Z0-9_]*$/.test(username))
    errors.username = "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです";

  if (password.length === 0) errors.password = "パスワードを入力してください";
  else if (/^(?:[^\P{Letter}&&\P{Number}]*){16,}$/v.test(password))
    errors.password = "パスワードには記号を含める必要があります";

  if (values.type === "signup") {
    if (name.length === 0) errors.name = "名前を入力してください";
  }

  return errors;
}

export const AuthModalPage = ({ onSubmit }: Props) => {
  const [type, setType] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const values: AuthFormData = { type, username, name, password, agreed };

  const handleToggleType = useCallback(() => {
    setType((t) => (t === "signin" ? "signup" : "signin"));
    setErrors({});
    setSubmitError(null);
  }, []);

  const handleChangeUsername = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (value && !/^[a-zA-Z0-9_]*$/.test(value)) {
      setErrors((prev) => ({ ...prev, username: "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです" }));
    } else {
      setErrors((prev) => ({ ...prev, username: undefined }));
    }
  }, []);

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) return true;
    if (type === "signup") {
      return !username.trim() || !password.trim() || !name.trim();
    }
    return !username.trim() || !password.trim();
  }, [isSubmitting, type, username, password, name]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const validationErrors = validateForm(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      setErrors({});
      setIsSubmitting(true);
      const error = await onSubmit(values);
      setIsSubmitting(false);
      if (error) setSubmitError(error);
    },
    [values, onSubmit],
  );

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button className="text-cax-brand underline" onClick={handleToggleType} type="button">
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <FormInputField
          label="ユーザー名"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
          value={username}
          onChange={handleChangeUsername}
          error={errors.username}
        />

        {type === "signup" && (
          <FormInputField
            label="名前"
            autoComplete="nickname"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            error={errors.name}
          />
        )}

        <FormInputField
          label="パスワード"
          type="password"
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          error={errors.password}
        />
      </div>

      {type === "signup" && (
        <div>
          <label className="flex cursor-pointer items-center gap-x-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              <Link className="text-cax-brand underline" to="/terms" target="_blank" rel="noreferrer">
                利用規約
              </Link>
              に同意する
            </span>
          </label>
          {errors.agreed && (
            <span className="text-cax-danger mt-1 block text-xs">
              <span className="mr-1">
                <FontAwesomeIcon iconType="exclamation-circle" styleType="solid" />
              </span>
              {errors.agreed}
            </span>
          )}
        </div>
      )}

      <ModalSubmitButton disabled={isSubmitDisabled} loading={isSubmitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
