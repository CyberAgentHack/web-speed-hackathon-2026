import { useForm } from "react-hook-form";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { validate } from "@web-speed-hackathon-2026/client/src/direct_message/validation";

interface Props {
  id: string;
  onSubmit: (values: NewDirectMessageFormData) => Promise<void>;
  serverError?: string;
}

export const NewDirectMessageModalPage = ({ id, onSubmit, serverError }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<NewDirectMessageFormData>({
    defaultValues: { username: "" },
    mode: "onTouched",
  });

  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form
        className="flex flex-col gap-y-6"
        onSubmit={handleSubmit(async (values) => {
          const validationErrors = validate(values);
          if (Object.keys(validationErrors).length > 0) return;
          await onSubmit(values);
        })}
      >
        <FormInputField
          label="ユーザー名"
          placeholder="username"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          error={errors.username?.message}
          {...register("username", {
            validate: (v) => {
              const errs = validate({ username: v ?? "" });
              return errs.username ?? true;
            },
          })}
        />

        <div className="grid gap-y-2">
          <ModalSubmitButton disabled={isSubmitting || !isValid} loading={isSubmitting}>
            DMを開始
          </ModalSubmitButton>
          <Button variant="secondary" command="close" commandfor={id}>
            キャンセル
          </Button>
        </div>

        <ModalErrorMessage>{serverError}</ModalErrorMessage>
      </form>
    </div>
  );
};
