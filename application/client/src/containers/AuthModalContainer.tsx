import { useCallback, useEffect, useRef, useState } from "react";

import { AuthFormData } from "@web-speed-hackathon-2026/client/src/auth/types";
import { validate } from "@web-speed-hackathon-2026/client/src/auth/validation";
import { AuthModalPage } from "@web-speed-hackathon-2026/client/src/components/auth_modal/AuthModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { HttpError, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
  openRequestId: number;
  onUpdateActiveUser: (user: Models.User) => void;
}

const INITIAL_VALUES: AuthFormData = {
  type: "signin",
  username: "",
  name: "",
  password: "",
};

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_USERNAME: "ユーザー名に使用できない文字が含まれています",
  USERNAME_TAKEN: "ユーザー名が使われています",
};

function getErrorCode(err: unknown, type: "signin" | "signup"): string {
  const responseJSON = err instanceof HttpError ? err.responseJSON : null;
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

export const AuthModalContainer = ({ id, openRequestId, onUpdateActiveUser }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<AuthFormData>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Partial<Record<keyof AuthFormData, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleToggle = () => {
      setValues(INITIAL_VALUES);
      setTouched({});
      setFormError(null);
      setIsSubmitting(false);
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      element.removeEventListener("toggle", handleToggle);
    };
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (openRequestId === 0 || element == null || element.open) {
      return;
    }

    element.showModal();
  }, [openRequestId]);

  const handleRequestCloseModal = useCallback(() => {
    ref.current?.close();
  }, [ref]);

  const updateField = useCallback((field: keyof AuthFormData, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setTouched((currentTouched) => ({
      ...currentTouched,
      [field]: true,
    }));
    setFormError(null);
  }, []);

  const handleToggleType = useCallback(() => {
    setValues((currentValues) => ({
      ...currentValues,
      type: currentValues.type === "signin" ? "signup" : "signin",
      name: "",
      password: "",
    }));
    setTouched({});
    setFormError(null);
  }, []);

  const handleSubmit = useCallback(
    async () => {
      const nextTouched: Partial<Record<keyof AuthFormData, boolean>> = {
        username: true,
        password: true,
      };
      if (values.type === "signup") {
        nextTouched.name = true;
      }
      setTouched(nextTouched);

      const errors = validate(values);
      if (Object.keys(errors).length > 0) {
        return;
      }

      try {
        setIsSubmitting(true);
        if (values.type === "signup") {
          const user = await sendJSON<Models.User>("/api/v1/signup", values);
          onUpdateActiveUser(user);
        } else {
          const user = await sendJSON<Models.User>("/api/v1/signin", values);
          onUpdateActiveUser(user);
        }
        handleRequestCloseModal();
      } catch (err: unknown) {
        setFormError(getErrorCode(err, values.type));
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleRequestCloseModal, onUpdateActiveUser, values],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      <AuthModalPage
        error={formError}
        errors={validate(values)}
        isSubmitting={isSubmitting}
        onRequestCloseModal={handleRequestCloseModal}
        onSubmit={handleSubmit}
        onToggleType={handleToggleType}
        onUpdateField={updateField}
        touched={touched}
        values={values}
      />
    </Modal>
  );
};
