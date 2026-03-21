import { ChangeEvent, FormEvent, useMemo, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<void>;
}

type FieldName = "username" | "name" | "password";

const INITIAL_VALUES: AuthFormData = {
  type: "signin",
  username: "",
  name: "",
  password: "",
};

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const [values, setValues] = useState<AuthFormData>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    username: false,
    name: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => validate(values), [values]);
  const isInvalid = Object.keys(errors).length > 0;

  const handleChange =
    (field: FieldName) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget;
      setValues((current) => ({ ...current, [field]: value }));
      setTouched((current) => ({ ...current, [field]: true }));
      setSubmitError(null);
    };

  const handleToggleType = () => {
    setValues((current) => ({
      ...current,
      type: current.type === "signin" ? "signup" : "signin",
    }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      username: true,
      name: values.type === "signup",
      password: true,
    });

    if (Object.keys(validate(values)).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
      setValues(INITIAL_VALUES);
      setTouched({
        username: false,
        name: false,
        password: false,
      });
    } catch (err) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("エラーが発生しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const type = values.type;

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
        <label className="grid gap-y-1 text-sm">
          <span>ユーザー名</span>
          <Input
            aria-invalid={touched.username && errors.username ? true : undefined}
            autoComplete="username"
            leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
            name="username"
            value={values.username}
            onChange={handleChange("username")}
          />
          {touched.username && errors.username ? (
            <span className="text-cax-danger text-xs">{errors.username}</span>
          ) : null}
        </label>

        {type === "signup" ? (
          <label className="grid gap-y-1 text-sm">
            <span>名前</span>
            <Input
              aria-invalid={touched.name && errors.name ? true : undefined}
              autoComplete="nickname"
              name="name"
              value={values.name}
              onChange={handleChange("name")}
            />
            {touched.name && errors.name ? (
              <span className="text-cax-danger text-xs">{errors.name}</span>
            ) : null}
          </label>
        ) : null}

        <label className="grid gap-y-1 text-sm">
          <span>パスワード</span>
          <Input
            aria-invalid={touched.password && errors.password ? true : undefined}
            autoComplete={type === "signup" ? "new-password" : "current-password"}
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange("password")}
          />
          {touched.password && errors.password ? (
            <span className="text-cax-danger text-xs">{errors.password}</span>
          ) : null}
        </label>
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

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
