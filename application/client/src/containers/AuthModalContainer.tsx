import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { reset, SubmissionError } from "redux-form";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AuthModalPage } from "@web-speed-hackathon-2026/client/src/components/auth_modal/AuthModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import type { AppDispatch } from "@web-speed-hackathon-2026/client/src/store";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
  onUpdateActiveUser: (user: Models.User) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_USERNAME: "ユーザー名に使用できない文字が含まれています",
  USERNAME_TAKEN: "ユーザー名が使われています",
};

async function getErrorCode(err: unknown, type: "signin" | "signup"): Promise<string> {
  if (err instanceof Response) {
    try {
      const responseJSON = await err.json();
      if (
        typeof responseJSON === "object" &&
        responseJSON !== null &&
        "code" in responseJSON &&
        typeof responseJSON.code === "string" &&
        Object.keys(ERROR_MESSAGES).includes(responseJSON.code)
      ) {
        return ERROR_MESSAGES[responseJSON.code]!;
      }
    } catch {
      // JSON parse failed
    }
  }
  if (type === "signup") {
    return "登録に失敗しました";
  } else {
    return "パスワードが異なります";
  }
}

export const AuthModalContainer = ({ id, onUpdateActiveUser }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleToggle = () => {
      // モーダルが閉じた時にredux-formの状態をリセットする
      if (!element.open) {
        dispatch(reset("auth"));
      }
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      element.removeEventListener("toggle", handleToggle);
    };
  }, [dispatch]);

  const handleRequestCloseModal = useCallback(() => {
    ref.current?.close();
  }, [ref]);

  const handleSubmit = useCallback(
    async (values: AuthFormData) => {
      try {
        if (values.type === "signup") {
          const user = await sendJSON<Models.User>("/api/v1/signup", values);
          onUpdateActiveUser(user);
        } else {
          const user = await sendJSON<Models.User>("/api/v1/signin", values);
          onUpdateActiveUser(user);
        }
        handleRequestCloseModal();
      } catch (err: unknown) {
        const error = await getErrorCode(err, values.type);
        throw new SubmissionError({
          _error: error,
        });
      }
    },
    [handleRequestCloseModal, onUpdateActiveUser],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      <AuthModalPage
        onRequestCloseModal={handleRequestCloseModal}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};
