import { FormEvent, useCallback, useState } from "react";

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
  const [values, setValues] = useState({ username: "", name: "", password: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const formData: AuthFormData = { type, ...values };
  const errors = validate(formData);
  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setSubmitError(undefined);
  }, []);

  const handleBlur = useCallback((name: string) => {
    setTouched((t) => ({ ...t, [name]: true }));
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, name: true, password: true });
    if (hasErrors) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setSubmitError(err?.message || (type === "signin" ? "パスワードが異なります" : "登録に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  }, [formData, hasErrors, onSubmit, type]);

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
          value={values.username}
          error={errors.username}
          touched={touched.username}
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
          onChange={handleChange}
          onBlur={() => handleBlur("username")}
        />

        {type === "signup" && (
          <FormInputField
            name="name"
            label="名前"
            value={values.name}
            error={errors.name}
            touched={touched.name}
            autoComplete="nickname"
            onChange={handleChange}
            onBlur={() => handleBlur("name")}
          />
        )}

        <FormInputField
          name="password"
          label="パスワード"
          value={values.password}
          error={errors.password}
          touched={touched.password}
          type="password"
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          onChange={handleChange}
          onBlur={() => handleBlur("password")}
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

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
