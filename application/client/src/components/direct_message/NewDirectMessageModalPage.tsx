import { ChangeEvent, FormEvent, useState } from "react";

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
  const [username, setUsername] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const errors = validate({ username });
  const invalid = Object.keys(errors).length > 0;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleBlur = () => {
    setTouched((prev) => ({ ...prev, username: true }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ username: true });
    if (invalid) return;

    setSubmitting(true);
    setServerError(undefined);
    try {
      const error = await onSubmit({ username });
      if (error) {
        setServerError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form className="flex flex-col gap-y-6" onSubmit={handleSubmit}>
        <FormInputField
          name="username"
          label="ユーザー名"
          placeholder="username"
          value={username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors["username"]}
          touched={touched["username"]}
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
        />

        <div className="grid gap-y-2">
          <ModalSubmitButton disabled={submitting || invalid} loading={submitting}>
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
