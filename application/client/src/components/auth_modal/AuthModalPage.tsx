import { useCallback, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

interface Props {
  onRequestCloseModal: () => void;
  onSubmit: (values: AuthFormData) => Promise<void>;
  resetNonce: number;
  serverError?: string;
}

export const AuthModalPage = ({ onRequestCloseModal, onSubmit, resetNonce, serverError }: Props) => {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    defaultValues: { type: "signin" },
    mode: "onSubmit",
  });

  const type = useWatch({ control, name: "type" }) ?? "signin";
  const username = useWatch({ control, name: "username" }) ?? "";
  const name = useWatch({ control, name: "name" }) ?? "";
  const password = useWatch({ control, name: "password" }) ?? "";
  const normalizedUsername = username.trim();
  const normalizedName = name.trim();
  const normalizedPassword = password.trim();
  const usernameFormatError =
    normalizedUsername.length > 0 && !/^[a-zA-Z0-9_]*$/.test(normalizedUsername)
      ? "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです"
      : undefined;
  const isSubmitDisabled =
    isSubmitting ||
    normalizedUsername.length === 0 ||
    normalizedPassword.length === 0 ||
    (type === "signup" && normalizedName.length === 0);
  useEffect(() => {
    reset({ type: "signin", username: "", password: "", name: "" });
    clearErrors();
  }, [clearErrors, reset, resetNonce]);

  const handleSubmitForm = useCallback(
    handleSubmit(async (values) => {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        for (const [field, message] of Object.entries(validationErrors)) {
          if (!message) {
            continue;
          }
          setError(field as keyof AuthFormData, { message, type: "manual" });
        }
        return;
      }
      await onSubmit(values);
    }),
    [handleSubmit, onSubmit, setError],
  );

  const toggleType = useCallback(() => {
    setValue("type", type === "signin" ? "signup" : "signin");
    clearErrors();
  }, [clearErrors, setValue, type]);

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmitForm}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={toggleType}
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
          error={errors.username?.message ?? usernameFormatError}
          {...register("username")}
        />

        {type === "signup" && (
          <FormInputField
            label="名前"
            autoComplete="nickname"
            error={errors.name?.message}
            {...register("name")}
          />
        )}

        <FormInputField
          label="パスワード"
          type="password"
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          error={errors.password?.message}
          {...register("password")}
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

      <ModalSubmitButton disabled={isSubmitDisabled} loading={isSubmitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{serverError}</ModalErrorMessage>
    </form>
  );
};
