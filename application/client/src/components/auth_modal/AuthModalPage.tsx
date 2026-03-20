import { useSelector } from "react-redux";
import {
  Field,
  formValueSelector,
  InjectedFormProps,
  reducer as formReducer,
  reduxForm,
} from "redux-form";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";
import { registerReducer } from "@web-speed-hackathon-2026/client/src/store";

registerReducer("form", formReducer);

interface Props {
  onRequestCloseModal: () => void;
}

const AuthModalPageComponent = ({
  onRequestCloseModal,
  handleSubmit,
  error,
  invalid,
  submitting,
  initialValues,
  change,
}: Props & InjectedFormProps<AuthFormData, Props>) => {
  const currentType: "signin" | "signup" = useSelector((state) =>
    // @ts-ignore: formValueSelectorの型付けが弱いため、型に嘘をつく
    formValueSelector("auth")(state, "type"),
  );
  const type = currentType ?? initialValues.type;

  return (
    <form className="grid gap-y-6" onSubmit={handleSubmit}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={() => change("type", type === "signin" ? "signup" : "signin")}
          type="button"
        >
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <Field
          name="username"
          component={FormInputField}
          props={{
            label: "ユーザー名",
            leftItem: <span className="text-cax-text-subtle leading-none">@</span>,
            autoComplete: "username",
          }}
        />

        {type === "signup" && (
          <Field
            name="name"
            component={FormInputField}
            props={{
              label: "名前",
              autoComplete: "nickname",
            }}
          />
        )}

        <Field
          name="password"
          component={FormInputField}
          props={{
            label: "パスワード",
            type: "password",
            autoComplete: type === "signup" ? "new-password" : "current-password",
          }}
        />
      </div>

      {type === "signup" ? (
        <p>
          <Link className="text-cax-brand underline" onClick={onRequestCloseModal} to="/terms">
            利用規約
          </Link>
          に同意して
        </p>
      ) : null}

      <ModalSubmitButton disabled={submitting || invalid} loading={submitting}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{error}</ModalErrorMessage>
    </form>
  );
};

export const AuthModalPage = reduxForm<AuthFormData, Props>({
  form: "auth",
  validate,
  initialValues: {
    type: "signin",
  },
})(AuthModalPageComponent);
