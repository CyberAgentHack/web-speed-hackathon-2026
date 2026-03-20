import { useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";
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
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const values = { username };
    const errors = validate(values);
    const nextFieldError = errors.username;
    setFieldError(nextFieldError);
    if (nextFieldError != null) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "ユーザーが見つかりませんでした";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form className="flex flex-col gap-y-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-y-1">
          <label className="block text-sm">ユーザー名</label>
          <Input
            leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
            placeholder="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setFieldError(undefined);
            }}
          />
          {fieldError != null && <span className="text-cax-danger text-xs">{fieldError}</span>}
        </div>

        <div className="grid gap-y-2">
          <ModalSubmitButton disabled={submitting || username.trim() === ""} loading={submitting}>
            DMを開始
          </ModalSubmitButton>
          <Button variant="secondary" command="close" commandfor={id}>
            キャンセル
          </Button>
        </div>

        <ModalErrorMessage>{error}</ModalErrorMessage>
      </form>
    </div>
  );
};
