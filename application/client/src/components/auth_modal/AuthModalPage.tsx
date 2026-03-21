import { useActionState, useState } from "react";

import { apiClient, HTTPError } from "@web-speed-hackathon-2026/client/src/api/client";
import { FormInputField } from "@web-speed-hackathon-2026/client/src/components/foundation/FormInputField";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { ModalErrorMessage } from "@web-speed-hackathon-2026/client/src/components/modal/ModalErrorMessage";
import { ModalSubmitButton } from "@web-speed-hackathon-2026/client/src/components/modal/ModalSubmitButton";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_USERNAME: "ユーザー名に使用できない文字が含まれています",
  USERNAME_TAKEN: "ユーザー名が使われています",
};

function getErrorMessage(err: unknown, type: "signin" | "signup"): string {
  const responseJSON = (err as HTTPError | undefined)?.responseJSON;
  if (
    typeof responseJSON === "object" &&
    responseJSON !== null &&
    "code" in responseJSON &&
    typeof responseJSON.code === "string" &&
    ERROR_MESSAGES[responseJSON.code]
  ) {
    return ERROR_MESSAGES[responseJSON.code]!;
  }
  return type === "signup" ? "登録に失敗しました" : "パスワードが異なります";
}

interface FieldErrors {
  username?: string;
  name?: string;
  password?: string;
}

function validateAuth(type: "signin" | "signup", formData: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const username = (formData.get("username") as string)?.trim() ?? "";
  const name = (formData.get("name") as string)?.trim() ?? "";
  const password = (formData.get("password") as string)?.trim() ?? "";

  if (username.length === 0) {
    errors.username = "ユーザー名を入力してください";
  } else if (!/^[a-zA-Z0-9_]*$/.test(username)) {
    errors.username = "ユーザー名に使用できるのは英数字とアンダースコア(_)のみです";
  }

  if (type === "signup" && name.length === 0) {
    errors.name = "名前を入力してください";
  }

  if (password.length === 0) {
    errors.password = "パスワードを入力してください";
  } else if (/^(?:[^\P{Letter}&&\P{Number}]*){16,}$/v.test(password)) {
    errors.password = "パスワードには記号を含める必要があります";
  }

  return errors;
}

interface FormState {
  error: string | null;
  fieldErrors: FieldErrors;
}

const initialState: FormState = { error: null, fieldErrors: {} };

interface Props {
  onRequestCloseModal: () => void;
  onUpdateActiveUser: (user: Models.User) => void;
}

export const AuthModalPage = ({ onRequestCloseModal, onUpdateActiveUser }: Props) => {
  const [type, setType] = useState<"signin" | "signup">("signin");

  const [state, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const fieldErrors = validateAuth(type, formData);
      if (Object.keys(fieldErrors).length > 0) {
        return { error: null, fieldErrors };
      }

      const username = (formData.get("username") as string).trim();
      const name = (formData.get("name") as string | null)?.trim() ?? "";
      const password = (formData.get("password") as string).trim();

      try {
        const res =
          type === "signup"
            ? await apiClient.signup.$post({ json: { type, username, name, password } })
            : await apiClient.signin.$post({ json: { type, username, password } });
        if (!res.ok) {
          throw new HTTPError(res.status, await res.json());
        }
        const user = await res.json();
        if ("code" in user) {
          throw new HTTPError(res.status, user);
        }
        onUpdateActiveUser(user as Models.User);
        onRequestCloseModal();
        return initialState;
      } catch (err) {
        return { error: getErrorMessage(err, type), fieldErrors: {} };
      }
    },
    initialState,
  );

  const hasErrors = Object.keys(state.fieldErrors).length > 0;

  return (
    <form className="grid gap-y-6" action={formAction}>
      <h2 className="text-center text-2xl font-bold">
        {type === "signin" ? "サインイン" : "新規登録"}
      </h2>

      <div className="flex justify-center">
        <button
          className="text-cax-brand underline"
          onClick={() => setType((t) => (t === "signin" ? "signup" : "signin"))}
          type="button"
        >
          {type === "signin" ? "初めての方はこちら" : "サインインはこちら"}
        </button>
      </div>

      <div className="grid gap-y-2">
        <FormInputField
          name="username"
          label="ユーザー名"
          leftItem={<span className="text-cax-text-subtle leading-none">@</span>}
          autoComplete="username"
          error={state.fieldErrors.username}
        />

        {type === "signup" && (
          <FormInputField
            name="name"
            label="名前"
            autoComplete="nickname"
            error={state.fieldErrors.name}
          />
        )}

        <FormInputField
          name="password"
          label="パスワード"
          type="password"
          autoComplete={type === "signup" ? "new-password" : "current-password"}
          error={state.fieldErrors.password}
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

      <ModalSubmitButton disabled={isPending || hasErrors} loading={isPending}>
        {type === "signin" ? "サインイン" : "登録する"}
      </ModalSubmitButton>

      <ModalErrorMessage>{state.error}</ModalErrorMessage>
    </form>
  );
};
