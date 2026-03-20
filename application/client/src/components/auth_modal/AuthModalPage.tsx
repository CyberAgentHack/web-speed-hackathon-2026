import { FormEvent, useCallback, useMemo, useState } from "react";

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

const INITIAL_VALUES: AuthFormData = {
  type: "signin",
  username: "",
  name: "",
  password: "",
};

export const AuthModalPage = ({ onRequestCloseModal, onSubmit }: Props) => {
  const [values, setValues] = useState<AuthFormData>(INITIAL_VALUES);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(() => validate(values), [values]);
  const isInvalid = Object.keys(errors).length > 0;
  const type = values.type;

  const handleFieldChange = useCallback((name: keyof AuthFormData, value: string) => {
    setSubmitError("");
    setValues((current) => ({ ...current, [name]: value }));
  }, []);

  const handleTypeToggle = useCallback(() => {
    setSubmitError("");
    setValues((current) => ({
      ...current,
      type: current.type === "signin" ? "signup" : "signin",
    }));
  }, []);

  const handleSubmit = useCallback(
    async (ev: FormEvent<HTMLFormElement>) => {
      ev.preventDefault();
      if (isInvalid || isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      setSubmitError("");
      try {
        const error = await onSubmit(values);
        if (error) {
          setSubmitError(error);
          return;
        }
        setValues(INITIAL_VALUES);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isInvalid, isSubmitting, onSubmit, values],
  );

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button className="text-cax-brand underline" onClick={handleTypeToggle} type="button">
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <FormInputField
          autoComplete="username"
          error={errors.username}
          label="ユーザー名"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          name="username"
          onChange={(ev) => handleFieldChange("username", ev.currentTarget.value)}
          value={values.username}
        />

        {type === "signup" ? (
          <FormInputField
            autoComplete="nickname"
            error={errors.name}
            label="名前"
            name="name"
            onChange={(ev) => handleFieldChange("name", ev.currentTarget.value)}
            value={values.name}
          />
        ) : null}

        <FormInputField
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          error={errors.password}
          label="パスワード"
          name="password"
          onChange={(ev) => handleFieldChange("password", ev.currentTarget.value)}
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

      <ModalSubmitButton disabled={isSubmitting || isInvalid} loading={isSubmitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{submitError}</ModalErrorMessage>
    </form>
  );
};
