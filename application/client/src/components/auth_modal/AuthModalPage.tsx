import { ChangeEvent, ReactNode, useId } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AuthFormErrors } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  error: string | null;
  errors: AuthFormErrors;
  isSubmitting: boolean;
  onRequestCloseModal: () => void;
  onSubmit: () => void;
  onToggleType: () => void;
  onUpdateField: (field: keyof AuthFormData, value: string) => void;
  touched: Partial<Record<keyof AuthFormData, boolean>>;
  values: AuthFormData;
}

const ErrorMessage = ({ id, message }: { id: string; message?: string }) => {
  if (!message) {
    return null;
  }

  return (
    <span className="text-cax-danger text-xs" id={id}>
      {message}
    </span>
  );
};

const AuthField = ({
  autoComplete,
  error,
  label,
  leftItem,
  name,
  onChange,
  touched,
  type = "text",
  value,
}: {
  autoComplete?: string;
  error?: string;
  label: string;
  leftItem?: ReactNode;
  name: keyof AuthFormData;
  onChange: (name: keyof AuthFormData, value: string) => void;
  touched: boolean;
  type?: string;
  value: string;
}) => {
  const inputId = useId();
  const errorMessageId = useId();
  const isInvalid = touched && error;

  return (
    <div className="flex flex-col gap-y-1">
      <label className="block text-sm" htmlFor={inputId}>
        {label}
      </label>
      <Input
        id={inputId}
        aria-describedby={isInvalid ? errorMessageId : undefined}
        aria-invalid={Boolean(isInvalid) || undefined}
        autoComplete={autoComplete}
        leftItem={leftItem}
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(name, event.target.value)}
      />
      <ErrorMessage id={errorMessageId} message={isInvalid ? error : undefined} />
    </div>
  );
};

export const AuthModalPage = ({
  error,
  errors,
  isSubmitting,
  onRequestCloseModal,
  onSubmit,
  onToggleType,
  onUpdateField,
  touched,
  values,
}: Props) => {
  const isInvalid = Object.keys(errors).length > 0;
  const type = values.type;

  return (
    <form
      className="grid gap-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={onToggleType}
          type="button"
        >
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <AuthField
          autoComplete="username"
          error={errors.username}
          label="ユーザー名"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          name="username"
          touched={Boolean(touched.username)}
          value={values.username}
          onChange={onUpdateField}
        />

        {type === "signup" && (
          <AuthField
            autoComplete="nickname"
            error={errors.name}
            label="名前"
            name="name"
            touched={Boolean(touched.name)}
            value={values.name}
            onChange={onUpdateField}
          />
        )}

        <AuthField
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          error={errors.password}
          label="パスワード"
          name="password"
          touched={Boolean(touched.password)}
          type="password"
          value={values.password}
          onChange={onUpdateField}
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

      <ModalSubmitButton disabled={isSubmitting || isInvalid} loading={isSubmitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{error}</ModalErrorMessage>
    </form>
  );
};
