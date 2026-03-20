import { ChangeEventHandler, FocusEventHandler, FormEventHandler, useMemo, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<string | null>;
}

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const [values, setValues] = useState<AuthFormData>({
    type: "signin",
    username: "",
    name: "",
    password: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof AuthFormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => validate(values), [values]);
  const hasError = Object.values(errors).some((value) => Boolean(value));
  const type = values.type;

  const handleChange = useMemo(() => {
    return {
      username: ((event) => {
        const value = event.currentTarget.value;
        setValues((current) => ({ ...current, username: value }));
      }) as ChangeEventHandler<HTMLInputElement>,
      name: ((event) => {
        const value = event.currentTarget.value;
        setValues((current) => ({ ...current, name: value }));
      }) as ChangeEventHandler<HTMLInputElement>,
      password: ((event) => {
        const value = event.currentTarget.value;
        setValues((current) => ({ ...current, password: value }));
      }) as ChangeEventHandler<HTMLInputElement>,
    };
  }, []);

  const markTouched = (field: keyof AuthFormData): FocusEventHandler<HTMLInputElement> => {
    return () => {
      setTouched((current) => ({ ...current, [field]: true }));
    };
  };

  const handleToggleType = () => {
    setSubmitError(null);
    setTouched({});
    setValues((current) => ({
      ...current,
      type: current.type === "signin" ? "signup" : "signin",
      name: current.type === "signin" ? current.name : "",
    }));
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setTouched({ username: true, name: true, password: true, type: true });
    setSubmitError(null);

    if (hasError) {
      return;
    }

    setIsSubmitting(true);
    const error = await onSubmit(values);
    setIsSubmitting(false);
    if (error) {
      setSubmitError(error);
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
        <FormInputField
          label="ユーザー名"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
          value={values.username}
          onChange={handleChange.username}
          onBlur={markTouched("username")}
          touched={touched.username ?? false}
          error={errors.username}
        />

        {type === "signup" && (
          <FormInputField
            label="名前"
            autoComplete="nickname"
            value={values.name}
            onChange={handleChange.name}
            onBlur={markTouched("name")}
            touched={touched.name ?? false}
            error={errors.name}
          />
        )}

        <FormInputField
          label="パスワード"
          type="password"
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          value={values.password}
          onChange={handleChange.password}
          onBlur={markTouched("password")}
          touched={touched.password ?? false}
          error={errors.password}
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

      <ModalSubmitButton disabled={isSubmitting || hasError} loading={isSubmitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
