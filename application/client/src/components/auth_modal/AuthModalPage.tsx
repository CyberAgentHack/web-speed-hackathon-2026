import { ChangeEventHandler, FormEventHandler, ReactNode, useId, useRef, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate, type AuthFormErrors } from "@web-speed-hackathon-2026/client/src/auth/validation";
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
  autoComplete?: string;
  error?: string;
  label: string;
  leftItem?: ReactNode;
  onBlur: () => void;
  onChange: ChangeEventHandler<HTMLInputElement>;
  inputRef?: React.Ref<HTMLInputElement>;
  type?: string;
}

const AuthInputField = ({
  autoComplete,
  error,
  label,
  leftItem,
  onBlur,
  onChange,
  inputRef,
  type = "text",
}: AuthInputFieldProps) => {
  const inputId = useId();
  const errorId = useId();
  const isInvalid = error != null;

  return (
    <div className="flex flex-col gap-y-1">
      <label className="block text-sm" htmlFor={inputId}>
        {label}
      </label>
      <Input
        id={inputId}
        aria-describedby={isInvalid ? errorId : undefined}
        aria-invalid={isInvalid || undefined}
        autoComplete={autoComplete}
        ref={inputRef}
        leftItem={leftItem}
        onBlur={onBlur}
        onChange={onChange}
        type={type}
      />
      {isInvalid && (
        <span className="text-cax-danger text-xs" id={errorId}>
          <span className="mr-1">
            <FontAwesomeIcon iconType="exclamation-circle" styleType="solid" />
          </span>
          {error}
        </span>
      )}
    </div>
  );
};

type VisibleErrors = Partial<Record<keyof AuthFormData, string>>;

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const usernameRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<AuthFormData["type"]>("signin");
  const [errors, setErrors] = useState<VisibleErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const readValues = (): AuthFormData => ({
    type,
    username: usernameRef.current?.value ?? "",
    name: nameRef.current?.value ?? "",
    password: passwordRef.current?.value ?? "",
  });

  const clearFieldError = (field: keyof AuthFormData) => {
    setErrors((current) => {
      if (current[field] == null) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleChangeField = (field: keyof AuthFormData): ChangeEventHandler<HTMLInputElement> => {
    return () => {
      setSubmitError(null);
      clearFieldError(field);
    };
  };

  const handleBlurField = (field: keyof AuthFormData) => () => {
    const nextErrors = validate(readValues());
    setErrors((current) => ({
      ...current,
      [field]: nextErrors[field],
    }));
  };

  const handleToggleType = () => {
    setSubmitError(null);
    setErrors({});
    setType((current) => (current === "signin" ? "signup" : "signin"));
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const values = readValues();
    const nextErrors: AuthFormErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "認証に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <AuthInputField
          autoComplete="username"
          error={errors.username}
          label="ユーザー名"
          inputRef={usernameRef}
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          onBlur={handleBlurField("username")}
          onChange={handleChangeField("username")}
        />

        {type === "signup" && (
          <AuthInputField
            autoComplete="nickname"
            error={errors.name}
            label="名前"
            inputRef={nameRef}
            onBlur={handleBlurField("name")}
            onChange={handleChangeField("name")}
          />
        )}

        <AuthInputField
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          error={errors.password}
          label="パスワード"
          inputRef={passwordRef}
          onBlur={handleBlurField("password")}
          onChange={handleChangeField("password")}
          type="password"
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

      <ModalSubmitButton disabled={isSubmitting} loading={isSubmitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
