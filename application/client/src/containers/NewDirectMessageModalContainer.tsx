import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { SubmissionError } from "redux-form";

import { apiClient } from "@web-speed-hackathon-2026/client/src/api/client";
import { NewDirectMessageModalPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/NewDirectMessageModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";

interface Props {
  id: string;
}

export const NewDirectMessageModalContainer = ({ id }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleClose = () => {
      setResetKey((key) => key + 1);
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
        const userRes = await apiClient.users[":username"].$get({
          param: { username: values.username },
        });
        if (!userRes.ok) {
          throw new Error("user not found");
        }
        const user = await userRes.json();
        const dmRes = await apiClient.dm.$post({ json: { peerId: user.id } });
        if (!dmRes.ok) {
          throw new Error("dm create failed");
        }
        const conversation = await dmRes.json();
        void navigate(`/dm/${conversation.id}`);
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
