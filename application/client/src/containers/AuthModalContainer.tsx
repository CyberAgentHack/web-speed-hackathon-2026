import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";

import type { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { store } from "@web-speed-hackathon-2026/client/src/store";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const loadAuthModalPage = () =>
  import("@web-speed-hackathon-2026/client/src/components/auth_modal/AuthModalPage");

const AuthModalPage = lazy(() =>
  loadAuthModalPage().then((module) => ({
    default: module.AuthModalPage,
  })),
);

interface Props {
  id: string;
  onUpdateActiveUser: (user: Models.User) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_USERNAME: "ユーザー名に使用できない文字が含まれています",
  USERNAME_TAKEN: "ユーザー名が使われています",
};

function getErrorCode(err: unknown, type: "signin" | "signup"): string {
  const fallback = type === "signup" ? "登録に失敗しました" : "パスワードが異なります";

  let code: string | undefined;

  if (typeof err === "object" && err !== null && "responseJSON" in err) {
    const responseJSON = (err as { responseJSON?: unknown }).responseJSON;
    if (
      typeof responseJSON === "object" &&
      responseJSON !== null &&
      "code" in responseJSON &&
      typeof responseJSON.code === "string"
    ) {
      code = responseJSON.code;
    }
  }

  if (
    code === undefined &&
    err instanceof Error &&
    err.message.startsWith("{") &&
    err.message.endsWith("}")
  ) {
    try {
      const parsed = JSON.parse(err.message) as { code?: unknown };
      if (typeof parsed.code === "string") {
        code = parsed.code;
      }
    } catch {
      return fallback;
    }
  }

  if (code === undefined || !Object.hasOwn(ERROR_MESSAGES, code)) {
    return fallback;
  }

  return ERROR_MESSAGES[code];
}

export const AuthModalContainer = ({ id, onUpdateActiveUser }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleToggle = () => {
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
        const { SubmissionError } = await import("redux-form");
        throw new SubmissionError({
          _error: error,
        });
      }
    },
    [handleRequestCloseModal, onUpdateActiveUser],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      <Provider store={store}>
        <Suspense fallback={<div className="p-4 text-center">読込中...</div>}>
          <AuthModalPage
            key={resetKey}
            onRequestCloseModal={handleRequestCloseModal}
            onSubmit={handleSubmit}
          />
        </Suspense>
      </Provider>
    </Modal>
  );
};

export function preloadAuthModalResources() {
  void loadAuthModalPage();
}
