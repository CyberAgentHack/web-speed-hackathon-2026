import { ChangeEventHandler, FormEventHandler, useId, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Input } from "@web-speed-hackathon-2026/client/src/components/foundation/Input";
import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";
import { validate } from "@web-speed-hackathon-2026/client/src/direct_message/validation";

interface Props {
  id: string;
  onSubmit: (username: string) => Promise<void>;
}

export const NewDirectMessageModalPage = ({ id, onSubmit }: Props) => {
  const inputId = useId();
  const errorId = useId();
  const [username, setUsername] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationError = useMemo(() => validate({ username }).username, [username]);
  const isInvalid = validationError != null;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setUsername(event.currentTarget.value);
    setSubmitError(null);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setTouched(true);

    if (isInvalid) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(username.trim().replace(/^@/, ""));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "ユーザーが見つかりませんでした");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form className="flex flex-col gap-y-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-y-1">
          <label className="block text-sm" htmlFor={inputId}>
            ユーザー名
          </label>
          <Input
            id={inputId}
            aria-describedby={touched && validationError ? errorId : undefined}
            aria-invalid={touched && validationError !== undefined ? true : undefined}
            leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
            onBlur={() => setTouched(true)}
            onChange={handleChange}
            placeholder="username"
            value={username}
          />
          {touched && validationError && (
            <span className="text-cax-danger text-xs" id={errorId}>
              <span className="mr-1">
                <FontAwesomeIcon iconType="exclamation-circle" styleType="solid" />
              </span>
              {validationError}
            </span>
          )}
        </div>

        <div className="grid gap-y-2">
          <ModalSubmitButton disabled={isSubmitting || isInvalid} loading={isSubmitting}>
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
