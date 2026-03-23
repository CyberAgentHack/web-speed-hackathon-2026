import { FormEvent, useCallback, useState } from "react";

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
  const [username, setUsername] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const errors = validate({ username });
  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;

    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await onSubmit({ username });
    } catch (err: any) {
      setSubmitError(err?.message || "ユーザーが見つかりませんでした");
    } finally {
      setSubmitting(false);
    }
  }, [username, hasErrors, onSubmit]);

  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form className="flex flex-col gap-y-6" onSubmit={handleSubmit}>
        <FormInputField
          name="username"
          label="ユーザー名"
          value={username}
          error={errors.username}
          touched={touched}
          placeholder="username"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => setTouched(true)}
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
