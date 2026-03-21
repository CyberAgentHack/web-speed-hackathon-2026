import { useState } from "react";

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
  const [touched, setTouched] = useState<Partial<Record<keyof AuthFormData, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const values: AuthFormData = { type, username, name, password };
  const errors = validate(values);
  const invalid = Object.keys(errors).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, name: true, password: true, type: true });
    if (invalid) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "エラーが発生しました");
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
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          input={{
            name: "username",
            value: username,
            autoComplete: "username",
            onChange: (e) => setUsername(e.target.value),
            onBlur: () => setTouched((t) => ({ ...t, username: true })),
          }}
          meta={{ touched: touched.username, error: errors.username }}
        />

        {type === "signup" && (
          <FormInputField
            label="名前"
            input={{
              name: "name",
              value: name,
              autoComplete: "nickname",
              onChange: (e) => setName(e.target.value),
              onBlur: () => setTouched((t) => ({ ...t, name: true })),
            }}
            meta={{ touched: touched.name, error: errors.name }}
          />
        )}

        <FormInputField
          label="パスワード"
          input={{
            name: "password",
            value: password,
            type: "password",
            autoComplete: type === "signup" ? "new-password" : "current-password",
            onChange: (e) => setPassword(e.target.value),
            onBlur: () => setTouched((t) => ({ ...t, password: true })),
          }}
          meta={{ touched: touched.password, error: errors.password }}
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
