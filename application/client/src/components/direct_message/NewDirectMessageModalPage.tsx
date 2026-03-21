import { ChangeEventHandler, FormEventHandler, useCallback, useMemo, useState } from "react";

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

/** 新規DM開始モーダルのフォーム */
export const NewDirectMessageModalPage = ({ id, onSubmit }: Props) => {
  const [values, setValues] = useState<NewDirectMessageFormData>({ username: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof NewDirectMessageFormData, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => validate(values), [values]);
  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((ev) => {
    const { name, value } = ev.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setSubmitError(null);
  }, []);

  const handleBlur = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    async (ev) => {
      ev.preventDefault();
      setTouched({ username: true });
      if (hasErrors) return;

      setSubmitting(true);
      try {
        await onSubmit(values);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "エラーが発生しました";
        setSubmitError(message);
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
          name="username"
          label="ユーザー名"
          value={values.username}
          error={errors.username}
          touched={touched.username}
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoFocus
          onChange={handleChange}
          onBlur={() => handleBlur("username")}
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
