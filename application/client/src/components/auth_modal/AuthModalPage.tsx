import { FormEvent, useCallback, useRef, useState } from "react";

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
  const [touched, setTouched] = useState<{
    username?: boolean;
    name?: boolean;
    password?: boolean;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formData: AuthFormData = { type, ...values };
  const errors = validate(formData);
  const invalid = Object.keys(errors).length > 0;

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setTouched({ username: true, name: true, password: true });

      if (invalid) return;

      setSubmitting(true);
      setError(null);
      try {
        await onSubmit(formDataRef.current);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(type === "signup" ? "登録に失敗しました" : "パスワードが異なります");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [invalid, onSubmit, type],
  );

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
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.username}
          touched={touched.username}
        />

        {type === "signup" && (
          <FormInputField
            name="name"
            label="名前"
            autoComplete="nickname"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            touched={touched.name}
          />
        )}

        <FormInputField
          name="password"
          label="パスワード"
          type="password"
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          touched={touched.password}
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
