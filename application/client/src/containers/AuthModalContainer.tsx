import { useCallback, useEffect, useRef, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AuthModalPage } from "@web-speed-hackathon-2026/client/src/components/auth_modal/AuthModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
  onUpdateActiveUser: (user: Models.User) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_USERNAME: "ユーザー名に使用できない文字が含まれています",
  USERNAME_TAKEN: "ユーザー名が使われています",
};

function getErrorMessage(err: unknown, type: "signin" | "signup"): string {
  if (err instanceof Response) {
    return type === "signup" ? "登録に失敗しました" : "パスワードが異なります";
  }
  if (typeof err === "object" && err !== null && "responseJSON" in err) {
    const responseJSON = (err as { responseJSON: unknown }).responseJSON;
    if (
      typeof responseJSON === "object" &&
      responseJSON !== null &&
      "code" in responseJSON &&
      typeof responseJSON.code === "string" &&
      Object.keys(ERROR_MESSAGES).includes(responseJSON.code)
    ) {
      return ERROR_MESSAGES[responseJSON.code]!;
    }
  }
  return type === "signup" ? "登録に失敗しました" : "パスワードが異なります";
}

export const AuthModalContainer = ({ id, onUpdateActiveUser }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleClose = () => {
      setResetKey((key) => key + 1);
      setServerError(undefined);
    };
    element.addEventListener("close", handleClose);
    return () => {
      element.removeEventListener("close", handleClose);
    };
  }, [ref, setResetKey]);

  const handleRequestCloseModal = useCallback(() => {
    ref.current?.close();
  }, [ref]);

  const handleSubmit = useCallback(
    async (values: AuthFormData) => {
      try {
        setServerError(undefined);
        if (values.type === "signup") {
          const user = await sendJSON<Models.User>("/api/v1/signup", values);
          onUpdateActiveUser(user);
        } else {
          const user = await sendJSON<Models.User>("/api/v1/signin", values);
          onUpdateActiveUser(user);
        }
        handleRequestCloseModal();
      } catch (err: unknown) {
        setServerError(getErrorMessage(err, values.type));
      }
    },
    [handleRequestCloseModal, onUpdateActiveUser],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      <AuthModalPage
        key={resetKey}
        onRequestCloseModal={handleRequestCloseModal}
        onSubmit={handleSubmit}
        serverError={serverError}
      />
    </Modal>
  );
};
