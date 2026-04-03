import { ChangeEvent, FormEvent, useState } from "react";

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const values: AuthFormData = { type, username, name, password };
  const errors = validate(values);
  const invalid = Object.keys(errors).length > 0;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, name: true, password: true });

    if (invalid) return;

    setSubmitting(true);
    setError(undefined);
    try {
      await onSubmit(values);
    } catch (err: unknown) {
      const submissionErr = err as { errors?: { _error?: string } };
      setError(submissionErr?.errors?._error);
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
          name="username"
          label="ユーザー名"
          value={username}
          error={errors.username}
          touched={touched.username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          onBlur={() => handleBlur("username")}
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
        />

        {type === "signup" && (
          <FormInputField
            name="name"
            label="名前"
            value={name}
            error={errors.name}
            touched={touched.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            onBlur={() => handleBlur("name")}
            autoComplete="nickname"
          />
        )}

        <FormInputField
          name="password"
          label="パスワード"
          value={password}
          error={errors.password}
          touched={touched.password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          onBlur={() => handleBlur("password")}
          type="password"
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

      <ModalSubmitButton disabled={submitting || invalid} loading={submitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{error}</ModalErrorMessage>
    </form>
  );
};
