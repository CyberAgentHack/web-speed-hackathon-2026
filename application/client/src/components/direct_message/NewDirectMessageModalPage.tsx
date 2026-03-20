import { FormEvent } from "react";
import { Field, InjectedFormProps, reduxForm } from "redux-form";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { validate } from "@web-speed-hackathon-2026/client/src/direct_message/validation";

interface Props {
  id: string;
  onClose?: () => void;
}

const NewDirectMessageModalPageComponent = ({
  invalid,
  error,
  submitting,
  handleSubmit,
  onClose,
}: Props & InjectedFormProps<NewDirectMessageFormData, Props>) => {
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit(event);
  };

  return (
    <form className="grid gap-y-6" onSubmit={handleFormSubmit}>
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <div className="flex flex-col gap-y-6">
        <Field
          name="username"
          component={FormInputField}
          props={{
            label: "ユーザー名",
            placeholder: "username",
            leftItem: <span className="text-cax-text-subtle leading-none">@</span>,
          }}
        />

        <div className="grid gap-y-2">
          <ModalSubmitButton disabled={submitting || invalid} loading={submitting}>
            DMを開始
          </ModalSubmitButton>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
        </div>

        <ModalErrorMessage>{error}</ModalErrorMessage>
      </div>
    </form>
  );
};

export const NewDirectMessageModalPage = reduxForm<NewDirectMessageFormData, Props>({
  form: "newDirectMessage",
  validate,
  initialValues: {
    username: "",
  },
})(NewDirectMessageModalPageComponent);
