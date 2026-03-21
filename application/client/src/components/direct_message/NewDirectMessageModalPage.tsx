import { ChangeEvent, FormEvent, useCallback, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";

interface Props {
  id: string;
  onSubmit: (values: NewDirectMessageFormData) => Promise<string | null>;
  onClose?: () => void;
}

export const NewDirectMessageModalPage = ({ id, onSubmit, onClose }: Props) => {
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const normalized = username.trim().replace(/^@/, "");
      if (normalized.length === 0) {
        setUsernameError("ユーザー名を入力してください");
        return;
      }
      setUsernameError(null);
      setIsSubmitting(true);
      const error = await onSubmit({ username: normalized });
      setIsSubmitting(false);
      if (error) setSubmitError(error);
    },
    [username, onSubmit],
  );

  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form className="flex flex-col gap-y-6" onSubmit={handleSubmit}>
        <FormInputField
          label="ユーザー名"
          placeholder="username"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          value={username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          error={usernameError}
        />

        <div className="grid gap-y-2">
          <ModalSubmitButton disabled={isSubmitting || !username.trim().replace(/^@/, "")} loading={isSubmitting}>
            DMを開始
          </ModalSubmitButton>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
        </div>

        <ModalErrorMessage>{submitError}</ModalErrorMessage>
      </form>
    </div>
  );
};
