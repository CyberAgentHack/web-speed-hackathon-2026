import { useForm, Controller } from "react-hook-form";

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
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isValid, touchedFields, isSubmitted },
  } = useForm<AuthFormData>({
    defaultValues: {
      type: "signin",
      username: "",
      name: "",
      password: "",
    },
    mode: "onChange",
    resolver: (values) => {
      const validationErrors = validate(values);
      const fieldErrors: Record<string, { type: string; message: string }> = {};
      for (const [key, message] of Object.entries(validationErrors)) {
        if (message) {
          fieldErrors[key] = { type: "validate", message };
        }
      }
      return { values: Object.keys(fieldErrors).length === 0 ? values : {}, errors: fieldErrors };
    },
  });

  const type = watch("type");

  const submitHandler = async (data: AuthFormData) => {
    try {
      await onSubmit(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError("root", { message });
    }
  };

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit(submitHandler)}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={() => setValue("type", type === "signin" ? "signup" : "signin")}
          type="button"
        >
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <Controller
          name="username"
          control={control}
          render={({ field, fieldState }) => (
            <FormInputField
              label="ユーザー名"
              leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
              autoComplete="username"
              field={field}
              error={fieldState.error}
              isTouched={touchedFields.username || isSubmitted}
            />
          )}
        />

        {type === "signup" && (
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <FormInputField
                label="名前"
                autoComplete="nickname"
                field={field}
                error={fieldState.error}
                isTouched={touchedFields.name || isSubmitted}
              />
            )}
          />
        )}

        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <FormInputField
              label="パスワード"
              type="password"
              autoComplete={type === "signup" ? "new-password" : "current-password"}
              field={field}
              error={fieldState.error}
              isTouched={touchedFields.password || isSubmitted}
            />
          )}
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

      <ModalSubmitButton disabled={isSubmitting || !isValid} loading={isSubmitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{errors.root?.message ?? null}</ModalErrorMessage>
    </form>
  );
};
