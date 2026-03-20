import { useCallback, useEffect, useState } from "react";
import { SubmissionError } from "redux-form";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { AuthModalPage } from "@web-speed-hackathon-2026/client/src/components/auth_modal/AuthModalPage";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

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

function getCheckbox(id: string): HTMLInputElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLInputElement ? el : null;
}

export const AuthModalContainer = ({ id, onUpdateActiveUser }: Props) => {
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const checkbox = getCheckbox(id);
    if (!checkbox) return;

    const handleChange = () => {
      // Reset form state when modal closes
      if (!checkbox.checked) {
        setResetKey((key) => key + 1);
      }
    };
    checkbox.addEventListener("change", handleChange);
    return () => {
      checkbox.removeEventListener("change", handleChange);
    };
  }, [id]);

  const handleRequestCloseModal = useCallback(() => {
    const checkbox = getCheckbox(id);
    if (checkbox) {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, [id]);

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
        const error = getErrorCode(err as JQuery.jqXHR<unknown>, values.type);
        throw new SubmissionError({
          _error: error,
        });
      }
    },
    [handleRequestCloseModal, onUpdateActiveUser],
  );

  return (
    <div className="ccss-modal-overlay auth-modal-overlay">
      {/* Backdrop - click to close */}
      <div className="bg-cax-overlay/50 fixed inset-0 z-40" onClick={handleRequestCloseModal} />
      <dialog
        open
        className="bg-cax-surface relative z-50 m-0 w-full max-w-[calc(min(var(--container-md),100%)-var(--spacing)*4)] rounded-lg border-none p-4"
      >
        <AuthModalPage
          key={resetKey}
          onRequestCloseModal={handleRequestCloseModal}
          onSubmit={handleSubmit}
        />
      </dialog>
    </div>
  );
};
