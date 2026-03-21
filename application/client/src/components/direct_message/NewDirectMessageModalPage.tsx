import { useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { validate } from "@web-speed-hackathon-2026/client/src/direct_message/validation";

interface Props {
  id: string;
  onSubmit: (values: NewDirectMessageFormData) => Promise<string | undefined>;
}

export const NewDirectMessageModalPage = ({ id, onSubmit }: Props) => {
  const [values, setValues] = useState<NewDirectMessageFormData>({ username: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const errors = validate(values);
  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ username: true });
    if (hasErrors) return;
    setSubmitting(true);
    setSubmitError(undefined);
    const error = await onSubmit(values);
    setSubmitting(false);
    if (error) setSubmitError(error);
  };

  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form className="flex flex-col gap-y-6" onSubmit={handleSubmit}>
        <FormInputField
          name="username"
          label="ユーザー名"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors["username"]}
          touched={touched["username"]}
          placeholder="username"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
        />

        <div className="grid gap-y-2">
          <ModalSubmitButton disabled={submitting || hasErrors} loading={submitting}>
            DMを開始
          </ModalSubmitButton>
          <Button variant="secondary" command="close" commandfor={id}>
            キャンセル
          </Button>
        </div>

        <ModalErrorMessage>{submitError ?? null}</ModalErrorMessage>
      </form>
    </div>
  );
};
