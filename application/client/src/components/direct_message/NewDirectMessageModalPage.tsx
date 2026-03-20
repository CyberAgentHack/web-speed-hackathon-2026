import { Field, InjectedFormProps, reducer as formReducer, reduxForm } from "redux-form";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { validate } from "@web-speed-hackathon-2026/client/src/direct_message/validation";
import { registerReducer } from "@web-speed-hackathon-2026/client/src/store";

registerReducer("form", formReducer);

interface Props {
  id: string;
}

const NewDirectMessageModalPageComponent = ({
  id,
  invalid,
  error,
  submitting,
  handleSubmit,
}: Props & InjectedFormProps<NewDirectMessageFormData, Props>) => {
  return (
    <div className="grid gap-y-6">
      <h2 className="text-center text-2xl font-bold">新しくDMを始める</h2>

      <form className="flex flex-col gap-y-6" onSubmit={handleSubmit}>
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
          <Button variant="secondary" command="close" commandfor={id}>
            キャンセル
          </Button>
        </div>

        <ModalErrorMessage>{error}</ModalErrorMessage>
      </form>
    </div>
  );
};

export const NewDirectMessageModalPage = reduxForm<NewDirectMessageFormData, Props>({
  form: "newDirectMessage",
  validate,
  initialValues: {
    username: "",
  },
})(NewDirectMessageModalPageComponent);
