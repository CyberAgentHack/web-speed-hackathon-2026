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
  const [type, setType] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<{ username?: boolean; name?: boolean; password?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const formData: AuthFormData = { type, username, name, password };
  const errors = validate(formData);
  const hasErrors = Object.keys(errors).length > 0;

  const handleBlur = useCallback((field: "username" | "name" | "password") => {
    setTouched((t) => ({ ...t, [field]: true }));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, name: true, password: true });
    if (hasErrors) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(formData);
    } catch (err) {
      setServerError(typeof err === "string" ? err : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={() => setType(type === "signin" ? "signup" : "signin")}
          type="button"
        >
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <FormInputField
          label="ユーザー名"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => handleBlur("username")}
          error={errors.username}
          touched={touched.username}
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
        />

        {type === "signup" && (
          <FormInputField
            label="名前"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur("name")}
            error={errors.name}
            touched={touched.name}
            autoComplete="nickname"
          />
        )}

        <FormInputField
          label="パスワード"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => handleBlur("password")}
          error={errors.password}
          touched={touched.password}
          autoComplete={type === "signup" ? "new-password" : "current-password"}
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

      <ModalSubmitButton disabled={submitting || hasErrors} loading={submitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{serverError}</ModalErrorMessage>
    </form>
  );
};
