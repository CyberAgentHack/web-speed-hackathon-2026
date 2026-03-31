import { useState, type ChangeEvent, type FormEvent } from "react";

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
  const [submitError, setSubmitError] = useState<string | undefined>();

  const errors = validate(values);
  const hasErrors = Object.keys(errors).length > 0;
  const type = values.type;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, name: true, password: true });
    if (hasErrors) return;
    setSubmitting(true);
    setSubmitError(undefined);
    const error = await onSubmit(values);
    setSubmitting(false);
    if (error) setSubmitError(error);
  };

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={() => setValues((prev) => ({ ...prev, type: type === "signin" ? "signup" : "signin" }))}
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
          onChange={handleChange}
          onBlur={handleBlur}
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
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors["name"]}
            touched={touched["name"]}
            autoComplete="nickname"
          />
        )}

        <FormInputField
          name="password"
          label="パスワード"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors["password"]}
          touched={touched["password"]}
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

      <ModalSubmitButton disabled={submitting || hasErrors} loading={submitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError ?? null}</ModalErrorMessage>
    </form>
  );
};
