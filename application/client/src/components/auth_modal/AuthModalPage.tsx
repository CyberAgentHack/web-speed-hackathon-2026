import { ChangeEvent, FormEvent, ReactNode, useId, useMemo, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<void>;
}

interface AuthInputFieldProps {
  autoComplete: string;
  error?: string;
  label: string;
  leftItem?: ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: "password" | "text";
  value: string;
}

const AuthInputField = ({
  autoComplete,
  error,
  label,
  leftItem,
  onChange,
  type = "text",
  value,
}: AuthInputFieldProps) => {
  const inputId = useId();
  const errorMessageId = useId();

  return (
    <div className="flex flex-col gap-y-1">
      <label className="block text-sm" htmlFor={inputId}>
        {label}
      </label>
      <Input
        id={inputId}
        aria-describedby={error ? errorMessageId : undefined}
        aria-invalid={error ? true : undefined}
        autoComplete={autoComplete}
        leftItem={leftItem}
        onChange={onChange}
        type={type}
        value={value}
      />
      {error ? (
        <span className="text-cax-danger text-xs" id={errorMessageId}>
          <span className="mr-1">
            <FontAwesomeIcon iconType="exclamation-circle" styleType="solid" />
          </span>
          {error}
        </span>
      ) : null}
    </div>
  );
};

const INITIAL_FORM_DATA: AuthFormData = {
  name: "",
  password: "",
  type: "signin",
  username: "",
};

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const [formData, setFormData] = useState<AuthFormData>(INITIAL_FORM_DATA);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => validate(formData), [formData]);
  const invalid = Object.keys(errors).length > 0;
  const type = formData.type;

  const handleFieldChange = (field: keyof Omit<AuthFormData, "type">) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setError(null);
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };
  };

  const handleToggleType = () => {
    setError(null);
    setFormData((prev) => ({
      ...prev,
      type: prev.type === "signin" ? "signup" : "signin",
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (invalid || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証に失敗しました");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

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
        <AuthInputField
          autoComplete="username"
          error={errors.username}
          label="ユーザー名"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          onChange={handleFieldChange("username")}
          value={formData.username}
        />

        {type === "signup" && (
          <AuthInputField
            autoComplete="nickname"
            error={errors.name}
            label="名前"
            onChange={handleFieldChange("name")}
            value={formData.name}
          />
        )}

        <AuthInputField
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          error={errors.password}
          label="パスワード"
          onChange={handleFieldChange("password")}
          type="password"
          value={formData.password}
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
