import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { SubmissionError } from "redux-form";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AuthModalPage = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/auth_modal/AuthModalPage").then(
    (module) => ({
      default: module.AuthModalPage,
    }),
  ),
);

interface Props {
  id: string;
  onUpdateActiveUser: (user: Models.User) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_USERNAME: "ユーザー名に使用できない文字が含まれています",
  USERNAME_TAKEN: "ユーザー名が使われています",
};

function extractErrorCode(err: unknown): string | null {
  if (typeof err === "object" && err !== null && "responseJSON" in err) {
    const responseJSON = (err as { responseJSON?: unknown }).responseJSON;
    if (
      typeof responseJSON === "object" &&
      responseJSON !== null &&
      "code" in responseJSON &&
      typeof (responseJSON as { code?: unknown }).code === "string"
    ) {
      return (responseJSON as { code: string }).code;
    }
  }

  if (err instanceof Error) {
    const match = err.message.match(/\{.*\}$/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { code?: unknown };
        if (typeof parsed.code === "string") {
          return parsed.code;
        }
      } catch {
        return null;
      }
    }
  }

  return null;
}

function getErrorCode(err: unknown, type: "signin" | "signup"): string {
  const code = extractErrorCode(err);
  if (code && Object.keys(ERROR_MESSAGES).includes(code)) {
    return ERROR_MESSAGES[code]!;
  }

  return type === "signup" ? "登録に失敗しました" : "パスワードが異なります";
}

export const AuthModalContainer = ({ id, onUpdateActiveUser }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  const [shouldRenderModalPage, setShouldRenderModalPage] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleToggle = () => {
      if (element.open) {
        setShouldRenderModalPage(true);
      }
      // モーダル開閉時にkeyを更新することでフォームの状態をリセットする
      setResetKey((key) => key + 1);
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      element.removeEventListener("toggle", handleToggle);
    };
  }, [ref, setResetKey]);

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
        const error = getErrorCode(err, values.type);
        throw new SubmissionError({
          _error: error,
        });
      }
    },
    [handleRequestCloseModal, onUpdateActiveUser],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      {shouldRenderModalPage ? (
        <Suspense fallback={null}>
          <AuthModalPage
            key={resetKey}
            onRequestCloseModal={handleRequestCloseModal}
            onSubmit={handleSubmit}
          />
        </Suspense>
      ) : null}
    </Modal>
  );
};
