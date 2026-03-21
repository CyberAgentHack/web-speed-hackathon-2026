import { ChangeEvent, ComponentPropsWithoutRef, FormEvent, ReactNode, useId, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AuthFormErrors, validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<void>;
}

type AuthFieldName = Exclude<keyof AuthFormData, "type">;
type TouchedFields = Partial<Record<AuthFieldName, boolean>>;

const INITIAL_VALUES: AuthFormData = {
  type: "signin",
  username: "",
  name: "",
  password: "",
};

const REQUIRED_FIELDS: Record<AuthFormData["type"], AuthFieldName[]> = {
  signin: ["username", "password"],
  signup: ["username", "name", "password"],
};

interface AuthInputFieldProps extends Omit<ComponentPropsWithoutRef<typeof Input>, "id"> {
  error?: string;
  label: string;
  leftItem?: ReactNode;
  rightItem?: ReactNode;
}

const AuthInputField = ({ error, label, leftItem, rightItem, ...props }: AuthInputFieldProps) => {
  const inputId = useId();
  const errorMessageId = useId();
  const isInvalid = Boolean(error);

  return (
    <div className="flex flex-col gap-y-1">
      <label className="block text-sm" htmlFor={inputId}>
        {label}
      </label>
      <Input
        id={inputId}
        leftItem={leftItem}
        rightItem={rightItem}
        aria-invalid={isInvalid || undefined}
        aria-describedby={isInvalid ? errorMessageId : undefined}
        {...props}
      />
      {isInvalid && (
        <span className="text-cax-danger text-xs" id={errorMessageId}>
          <span className="mr-1">
            <FontAwesomeIcon iconType="exclamation-circle" styleType="solid" />
          </span>
          {error}
        </span>
      )}
    </div>
  );
};

function hasRelevantErrors(type: AuthFormData["type"], errors: AuthFormErrors) {
  return REQUIRED_FIELDS[type].some((field) => Boolean(errors[field]));
}

function hasRequiredValues(values: AuthFormData) {
  return REQUIRED_FIELDS[values.type].every((field) => values[field].trim().length > 0);
}

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const [values, setValues] = useState<AuthFormData>(INITIAL_VALUES);
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const type = values.type;
  const isSubmitDisabled =
    submitting || !hasRequiredValues(values) || hasRelevantErrors(type, errors);

  const handleInputChange = (field: AuthFieldName) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value;

    setValues((currentValues) => ({
      ...currentValues,
      [field]: nextValue,
    }));
    setSubmitError(null);
    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      return {
        ...currentErrors,
        [field]: undefined,
      };
    });
  };

  const handleInputBlur = (field: AuthFieldName) => () => {
    setTouchedFields((currentTouchedFields) => ({
      ...currentTouchedFields,
      [field]: true,
    }));
    setErrors(validate(values));
  };

  const handleToggleType = () => {
    setValues((currentValues) => ({
      ...currentValues,
      type: currentValues.type === "signin" ? "signup" : "signin",
    }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouchedFields((currentTouchedFields) => ({
      ...currentTouchedFields,
      ...Object.fromEntries(REQUIRED_FIELDS[type].map((field) => [field, true])),
    }));
    setSubmitError(null);

    if (hasRelevantErrors(type, nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "認証に失敗しました");
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
          onClick={handleToggleType}
          type="button"
        >
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <AuthInputField
          autoComplete="username"
          error={touchedFields.username ? errors.username : undefined}
          label="ユーザー名"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          name="username"
          onBlur={handleInputBlur("username")}
          onChange={handleInputChange("username")}
          value={values.username}
        />

        {type === "signup" && (
          <AuthInputField
            autoComplete="nickname"
            error={touchedFields.name ? errors.name : undefined}
            label="名前"
            name="name"
            onBlur={handleInputBlur("name")}
            onChange={handleInputChange("name")}
            value={values.name}
          />
        )}

        <AuthInputField
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          error={touchedFields.password ? errors.password : undefined}
          label="パスワード"
          name="password"
          onBlur={handleInputBlur("password")}
          onChange={handleInputChange("password")}
          type="password"
          value={values.password}
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

      <ModalSubmitButton disabled={isSubmitDisabled} loading={submitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
