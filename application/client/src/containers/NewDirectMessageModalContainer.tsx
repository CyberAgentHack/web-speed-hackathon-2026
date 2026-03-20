import { useCallback, useEffect, useRef, useState } from "react";

import { NewDirectMessageModalPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/NewDirectMessageModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
}

export const NewDirectMessageModalContainer = ({ id }: Props) => {
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

  const handleSubmit = useCallback(
    async (username: string) => {
      try {
        const user = await fetchJSON<Models.User>(`/api/v1/users/${username}`);
        const conversation = await sendJSON<Models.DirectMessageConversation>(`/api/v1/dm`, {
          peerId: user.id,
        });
        window.location.assign(`/dm/${conversation.id}`);
      } catch {
        throw new Error("ユーザーが見つかりませんでした");
      }
    },
    [],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      <NewDirectMessageModalPage key={resetKey} id={id} onSubmit={handleSubmit} />
    </Modal>
  );
};
