import { useForm, Controller } from "react-hook-form";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { validate } from "@web-speed-hackathon-2026/client/src/direct_message/validation";

interface Props {
  id: string;
  onSubmit: (values: NewDirectMessageFormData) => Promise<void>;
}

export const NewDirectMessageModalPage = ({ id, onSubmit }: Props) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid, touchedFields, isSubmitted },
  } = useForm<NewDirectMessageFormData>({
    defaultValues: {
      username: "",
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

  const submitHandler = async (data: NewDirectMessageFormData) => {
    try {
      await onSubmit(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError("root", { message });
    }
  };

  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form className="flex flex-col gap-y-6" onSubmit={handleSubmit(submitHandler)}>
        <Controller
          name="username"
          control={control}
          render={({ field, fieldState }) => (
            <FormInputField
              label="ユーザー名"
              placeholder="username"
              leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
              field={field}
              error={fieldState.error}
              isTouched={touchedFields.username || isSubmitted}
            />
          )}
        />

        <div className="grid gap-y-2">
          <ModalSubmitButton disabled={isSubmitting || !isValid} loading={isSubmitting}>
            DMを開始
          </ModalSubmitButton>
          <Button variant="secondary" command="close" commandfor={id}>
            キャンセル
          </Button>
        </div>

        <ModalErrorMessage>{errors.root?.message ?? null}</ModalErrorMessage>
      </form>
    </div>
  );
};
