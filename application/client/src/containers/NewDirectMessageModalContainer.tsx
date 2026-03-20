import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { SubmissionError } from "redux-form";

import { NewDirectMessageModalPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/NewDirectMessageModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
}

interface CreateConversationResponse {
  id: string;
}

export const NewDirectMessageModalContainer = ({ id }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleToggle = () => {
      if (!element.open) {
        setResetKey((key) => key + 1);
      }
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      element.removeEventListener("toggle", handleToggle);
    };
  }, [ref]);

  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (values: NewDirectMessageFormData) => {
      try {
        const normalizedUsername = values.username.trim().replace(/^@/, "");
        const conversation = await sendJSON<CreateConversationResponse>(`/api/v1/dm`, {
          username: normalizedUsername,
        });
        ref.current?.close();
        navigate(`/dm/${conversation.id}`);
      } catch {
        throw new SubmissionError({
          _error: "ユーザーが見つかりませんでした",
        });
      }
    },
    [navigate, ref],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      <NewDirectMessageModalPage key={resetKey} id={id} onSubmit={handleSubmit} />
    </Modal>
  );
};
