import { useCallback, useEffect, useRef, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AuthModalPage } from "@web-speed-hackathon-2026/client/src/components/auth_modal/AuthModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
  onUpdateActiveUser: (user: Models.User) => void;
}

function getErrorMessage(err: unknown, type: "signin" | "signup"): string {
  const ERROR_MESSAGES: Record<string, string> = {
    INVALID_USERNAME: "ユーザー名に使用できない文字が含まれています",
    USERNAME_TAKEN: "ユーザー名が使われています",
  };
  const responseJSON = (err as any)?.responseJSON;
  if (
    typeof responseJSON === "object" &&
    responseJSON !== null &&
    typeof responseJSON.code === "string" &&
    responseJSON.code in ERROR_MESSAGES
  ) {
    return ERROR_MESSAGES[responseJSON.code]!;
  }
  return type === "signup" ? "登録に失敗しました" : "パスワードが異なります";
}

export const AuthModalContainer = ({ id, onUpdateActiveUser }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    const handleClose = () => {
      setResetKey((key) => key + 1);
    };
    element.addEventListener("close", handleClose);
    return () => element.removeEventListener("close", handleClose);
  }, []);

  const handleRequestCloseModal = useCallback(() => {
    ref.current?.close();
  }, []);

  const handleSubmit = useCallback(
    async (values: AuthFormData): Promise<string | null> => {
      try {
        if (values.type === "signup") {
          const user = await sendJSON<Models.User>("/api/v1/signup", values);
          onUpdateActiveUser(user);
        } else {
          const user = await sendJSON<Models.User>("/api/v1/signin", values);
          onUpdateActiveUser(user);
        }
        handleRequestCloseModal();
        return null;
      } catch (err: unknown) {
        return getErrorMessage(err, values.type);
      }
    },
    [handleRequestCloseModal, onUpdateActiveUser],
  );

  return (
    <Modal id={id} ref={ref}>
      <AuthModalPage key={resetKey} onSubmit={handleSubmit} />
    </Modal>
  );
};
