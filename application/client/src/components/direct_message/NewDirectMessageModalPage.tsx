import { ChangeEvent, FormEvent, useCallback, useState } from "react";

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
  const [values, setValues] = useState<NewDirectMessageFormData>({ username: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof NewDirectMessageFormData, boolean>>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const errors = validate(values);
  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setTouched({ username: true });
      if (hasErrors) return;
      setSubmitting(true);
      setSubmitError(undefined);
      try {
        await onSubmit(values);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setSubmitError(err.message);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [values, hasErrors, onSubmit],
  );

  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form className="flex flex-col gap-y-6" onSubmit={handleSubmit}>
        <FormInputField
          label="ユーザー名"
          name="username"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="username"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          error={touched.username ? errors.username : undefined}
        />

        <div className="grid gap-y-2">
          <ModalSubmitButton disabled={submitting || hasErrors} loading={submitting}>
            DMを開始
          </ModalSubmitButton>
          <Button variant="secondary" command="close" commandfor={id}>
            キャンセル
          </Button>
        </div>

        <ModalErrorMessage>{submitError}</ModalErrorMessage>
      </form>
    </div>
  );
};
