import { ChangeEvent, FormEvent, useCallback, useDeferredValue, useMemo, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<string | undefined>;
}

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const [values, setValues] = useState<AuthFormData>({
    type: "signin",
    username: "",
    name: "",
    password: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const deferredValues = useDeferredValue(values);
  const errors = useMemo(() => validate(deferredValues), [deferredValues]);
  const invalid = Object.keys(errors).length > 0;

  const type = values.type;

  const handleChange = useCallback((field: keyof AuthFormData) => (e: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleBlur = useCallback((field: string) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleToggleType = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      type: prev.type === "signin" ? "signup" : "signin",
    }));
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const currentErrors = validate(values);
    const isInvalid = Object.keys(currentErrors).length > 0;
    setTouched({ username: true, name: true, password: true });
    if (isInvalid) return;

    setSubmitting(true);
    setServerError(undefined);
    try {
      const error = await onSubmit(values);
      if (error) {
        setServerError(error);
      }
    } finally {
      setSubmitting(false);
    }
  }, [onSubmit, values]);

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
        <FormInputField
          name="username"
          label="ユーザー名"
          value={values.username}
          onChange={handleChange("username")}
          onBlur={handleBlur("username")}
          error={errors["username"]}
          touched={touched["username"]}
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
        />

        {type === "signup" && (
          <FormInputField
            name="name"
            label="名前"
            value={values.name}
            onChange={handleChange("name")}
            onBlur={handleBlur("name")}
            error={errors["name"]}
            touched={touched["name"]}
            autoComplete="nickname"
          />
        )}

        <FormInputField
          name="password"
          label="パスワード"
          type="password"
          value={values.password}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          error={errors["password"]}
          touched={touched["password"]}
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

      <ModalErrorMessage>{serverError}</ModalErrorMessage>
    </form>
  );
};
