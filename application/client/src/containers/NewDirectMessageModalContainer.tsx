import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { NewDirectMessageModalPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/NewDirectMessageModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
}

export const NewDirectMessageModalContainer = ({ id }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleClose = () => {
      setResetKey((key) => key + 1);
      setServerError(undefined);
    };
    element.addEventListener("close", handleClose);
    return () => {
      element.removeEventListener("close", handleClose);
    };
  }, [ref]);

  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (values: NewDirectMessageFormData) => {
      try {
        setServerError(undefined);
        const conversation = await sendJSON<Models.DirectMessageConversation>(`/api/v1/dm`, {
          username: values.username,
        });
        navigate(`/dm/${conversation.id}`);
      } catch {
        setServerError("ユーザーが見つかりませんでした");
      }
    },
    [navigate],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      <NewDirectMessageModalPage
        key={resetKey}
        id={id}
        onSubmit={handleSubmit}
        serverError={serverError}
      />
    </Modal>
  );
};
