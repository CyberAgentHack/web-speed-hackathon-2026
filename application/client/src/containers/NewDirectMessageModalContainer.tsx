import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { SubmissionError } from "redux-form";

import { NewDirectMessageModalPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/NewDirectMessageModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { observeDialogOpen } from "@web-speed-hackathon-2026/client/src/utils/observe_dialog_open";

interface Props {
  id: string;
}

export const NewDirectMessageModalContainer = ({ id }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }

    return observeDialogOpen(element, (isOpen) => {
      if (!isOpen) {
        setResetKey((key) => key + 1);
      }
    });
  }, []);

  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (values: NewDirectMessageFormData) => {
      try {
        const user = await fetchJSON<Models.User>(`/api/v1/users/${values.username}`);
        const conversation = await sendJSON<Models.DirectMessageConversation>(`/api/v1/dm`, {
          peerId: user.id,
        });
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
