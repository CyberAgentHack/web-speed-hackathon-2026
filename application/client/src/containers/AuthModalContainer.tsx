import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const AuthModalPage = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/auth_modal/AuthModalPage").then((m) => ({
    default: m.AuthModalPage,
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

function getErrorCode(err: { responseJSON?: unknown }, type: "signin" | "signup"): string {
  const responseJSON = err.responseJSON;
  if (
    typeof responseJSON !== "object" ||
    responseJSON === null ||
    !("code" in responseJSON) ||
    typeof responseJSON.code !== "string" ||
    !Object.keys(ERROR_MESSAGES).includes(responseJSON.code)
  ) {
    if (type === "signup") {
      return "登録に失敗しました";
    } else {
      return "パスワードが異なります";
    }
  }

  return ERROR_MESSAGES[responseJSON.code]!;
}

export const AuthModalContainer = ({ id, onUpdateActiveUser }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [hasLoadedPage, setHasLoadedPage] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }

    const handleToggle = () => {
      if (element.open) {
        setHasLoadedPage(true);
      }
      setResetKey((key) => key + 1);
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      element.removeEventListener("toggle", handleToggle);
    };
  }, []);

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
        return null;
      } catch (err: unknown) {
        return getErrorCode(err as { responseJSON?: unknown }, values.type);
      }
    },
    [handleRequestCloseModal, onUpdateActiveUser],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      {hasLoadedPage ? (
        <Suspense
          fallback={
            <div className="animate-pulse space-y-6 p-2">
              <h2 className="text-center text-2xl font-bold">サインイン</h2>
              <div className="space-y-2">
                <div className="bg-cax-border h-12 w-full rounded-full" />
                <div className="bg-cax-border h-12 w-full rounded-full" />
              </div>
              <div className="bg-cax-border h-10 w-full rounded-full" />
            </div>
          }
        >
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
