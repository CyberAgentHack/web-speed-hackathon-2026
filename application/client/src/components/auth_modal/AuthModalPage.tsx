import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AuthFormErrors, validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<string | null>;
}

type AuthFieldName = "username" | "name" | "password";

const INITIAL_DIRTY_FIELDS: Record<AuthFieldName, boolean> = {
  username: false,
  name: false,
  password: false,
};

const getAuthFormData = (formData: FormData): AuthFormData => ({
  type: formData.get("type") === "signup" ? "signup" : "signin",
  username: String(formData.get("username") ?? ""),
  name: String(formData.get("name") ?? ""),
  password: String(formData.get("password") ?? ""),
});

const SubmitButton = ({ type }: { type: "signin" | "signup" }) => {
  const { pending } = useFormStatus();

  return (
    <ModalSubmitButton disabled={pending} loading={pending}>
      {type === "signin" ? "サインイン" : "登録する"}
    </ModalSubmitButton>
  );
};

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<AuthFormData["type"]>("signin");
  const [dirtyFields, setDirtyFields] = useState<Record<AuthFieldName, boolean>>(INITIAL_DIRTY_FIELDS);
  const [validationErrors, setValidationErrors] = useState<AuthFormErrors>({});
  const [error, setError] = useState<string | null>(null);

  const getFieldError = (fieldName: AuthFieldName) => {
    if (!dirtyFields[fieldName]) {
      return undefined;
    }

    return validationErrors[fieldName];
  };

  const updateFieldValidation = (fieldName: AuthFieldName) => {
    const form = formRef.current;

    if (!form) {
      return;
    }

    setDirtyFields((currentFields) => ({
      ...currentFields,
      [fieldName]: true,
    }));

    setValidationErrors(validate(getAuthFormData(new FormData(form))));
  };

  const handleAction = async (formData: FormData) => {
    const nextValues = getAuthFormData(formData);
    const nextValidationErrors = validate(nextValues);

    setDirtyFields({ ...INITIAL_DIRTY_FIELDS, username: true, name: true, password: true });
    setValidationErrors(nextValidationErrors);

    if (Object.keys(nextValidationErrors).length > 0) {
      setError(null);
      return;
    }

    const nextError = await onSubmit(nextValues);
    setError(nextError);
  };

  return (
    <form ref={formRef} action={handleAction} className="grid gap-y-6">
      <input name="type" type="hidden" value={type} />

      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={() => {
            setType((currentType) => (currentType === "signin" ? "signup" : "signin"));
            setDirtyFields(INITIAL_DIRTY_FIELDS);
            setValidationErrors({});
            setError(null);
          }}
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
          onBlur={() => updateFieldValidation("username")}
          errorMessage={getFieldError("username")}
        />

        {type === "signup" && (
          <FormInputField
            name="name"
            label="名前"
            autoComplete="nickname"
            onBlur={() => updateFieldValidation("name")}
            errorMessage={getFieldError("name")}
          />
        )}

        <FormInputField
          name="password"
          label="パスワード"
          type="password"
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          onBlur={() => updateFieldValidation("password")}
          errorMessage={getFieldError("password")}
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

      <SubmitButton type={type} />

      <ModalErrorMessage>{error}</ModalErrorMessage>
    </form>
  );
};
