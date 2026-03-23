import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<string | null>;
}

const INITIAL_VALUES: AuthFormData = {
  type: "signin",
  username: "",
  name: "",
  password: "",
};

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const [values, setValues] = useState<AuthFormData>(INITIAL_VALUES);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(() => validate(values), [values]);
  const isInvalid = Object.values(errors).some(Boolean);

  const handleChange = useCallback(
    (key: keyof AuthFormData) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setSubmitError(null);
      setValues((current) => ({
        ...current,
        [key]: nextValue,
      }));
    },
    [],
  );

  const handleToggleType = useCallback(() => {
    setSubmitError(null);
    setValues((current) => ({
      ...INITIAL_VALUES,
      type: current.type === "signin" ? "signup" : "signin",
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting || isInvalid) {
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const error = await onSubmit(values);
        if (error !== null) {
          setSubmitError(error);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [isInvalid, isSubmitting, onSubmit, values],
  );

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 className="text-center text-2xl font-bold">
        {values.type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button className="text-cax-brand underline" onClick={handleToggleType} type="button">
          {values.type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <div className="flex flex-col gap-y-1">
          <label className="block text-sm" htmlFor="auth-username">
            ユーザー名
          </label>
          <Input
            id="auth-username"
            aria-invalid={errors.username ? true : undefined}
            autoComplete="username"
            leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
            value={values.username}
            onChange={handleChange("username")}
          />
          {errors.username ? <span className="text-cax-danger text-xs">{errors.username}</span> : null}
        </div>

        {values.type === "signup" ? (
          <div className="flex flex-col gap-y-1">
            <label className="block text-sm" htmlFor="auth-name">
              名前
            </label>
            <Input
              id="auth-name"
              aria-invalid={errors.name ? true : undefined}
              autoComplete="nickname"
              value={values.name}
              onChange={handleChange("name")}
            />
            {errors.name ? <span className="text-cax-danger text-xs">{errors.name}</span> : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-y-1">
          <label className="block text-sm" htmlFor="auth-password">
            パスワード
          </label>
          <Input
            id="auth-password"
            aria-invalid={errors.password ? true : undefined}
            autoComplete={values.type === "signup" ? "new-password" : "current-password"}
            type="password"
            value={values.password}
            onChange={handleChange("password")}
          />
          {errors.password ? <span className="text-cax-danger text-xs">{errors.password}</span> : null}
        </div>
      </div>

      {values.type === "signup" ? (
        <p>
          <Link className="text-cax-brand underline" onClick={onRequestCloseModal} to="/terms">
            利用規約
          </Link>
          に同意して
        </p>
      ) : null}

      <ModalSubmitButton disabled={isSubmitting || isInvalid} loading={isSubmitting}>
        {values.type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
