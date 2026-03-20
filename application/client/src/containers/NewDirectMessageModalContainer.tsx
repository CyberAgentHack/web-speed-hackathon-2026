import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { SubmissionError } from "redux-form";

import { NewDirectMessageModalPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/NewDirectMessageModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { fetchJSON, HTTPError, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
}

export const NewDirectMessageModalContainer = ({ id }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  // Synchronize the form reset key with the dialog open/close state.
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

  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (values: NewDirectMessageFormData) => {
      try {
        const user = await fetchJSON<Models.User>(`/api/v1/users/${values.username}`);
        const conversation = await sendJSON<Models.DirectMessageConversation>(`/api/v1/dm`, {
          peerId: user.id,
        });
        ref.current?.close();
        navigate(`/dm/${conversation.id}`);
      } catch (error) {
        const errorMessage =
          error instanceof HTTPError && error.status === 404
            ? "ユーザーが見つかりませんでした"
            : "DMの開始に失敗しました";
        throw new SubmissionError({
          _error: errorMessage,
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
