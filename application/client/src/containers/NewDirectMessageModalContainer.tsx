import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { SubmissionError } from "redux-form";

import { NewDirectMessageModalPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/NewDirectMessageModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
  openRequestKey?: number;
}

export const NewDirectMessageModalContainer = ({ id, openRequestKey = 0 }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleToggle = () => {
      setResetKey((key) => key + 1);
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      element.removeEventListener("toggle", handleToggle);
    };
  }, [ref]);

  useEffect(() => {
    const element = ref.current;
    if (element == null || openRequestKey === 0 || element.open) {
      return;
    }
    element.showModal();
  }, [openRequestKey]);

  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (values: NewDirectMessageFormData) => {
      try {
        const conversation = await sendJSON<Models.DirectMessageConversation>(`/api/v1/dm`, {
          username: values.username.trim().replace(/^@/, ""),
        });
        ref.current?.close();
        navigate(`/dm/${conversation.id}`);
      } catch {
        throw new SubmissionError({
          _error: "ユーザーが見つかりませんでした",
        });
      }
    },
    [navigate],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      <NewDirectMessageModalPage key={resetKey} id={id} onSubmit={handleSubmit} />
    </Modal>
  );
};
