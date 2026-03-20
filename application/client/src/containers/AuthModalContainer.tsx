import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

import type { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";

const LazyAuthModalPage = lazy(() =>
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

function getErrorCode(err: JQuery.jqXHR<unknown>, type: "signin" | "signup"): string {
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
  const [hasOpened, setHasOpened] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    void import("@web-speed-hackathon-2026/client/src/components/auth_modal/AuthModalPage");
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleToggle = () => {
      setHasOpened(true);
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
      if (values.type === "signup") {
        try {
          const user = await sendJSON<Models.User>("/api/v1/signup", values);
          onUpdateActiveUser(user);
          handleRequestCloseModal();
          return;
        } catch (err: unknown) {
          const error = getErrorCode(err as JQuery.jqXHR<unknown>, values.type);
          throw new Error(error);
        }
      }

      try {
        const user = await sendJSON<Models.User>("/api/v1/signin", values);
        onUpdateActiveUser(user);
        handleRequestCloseModal();
      } catch (err: unknown) {
        const error = getErrorCode(err as JQuery.jqXHR<unknown>, values.type);
        throw new Error(error);
      }
    },
    [handleRequestCloseModal, onUpdateActiveUser],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      {hasOpened && (
        <Suspense fallback={null}>
          <LazyAuthModalPage
            key={resetKey}
            onRequestCloseModal={handleRequestCloseModal}
            onSubmit={handleSubmit}
          />
        </Suspense>
      )}
    </Modal>
  );
};
