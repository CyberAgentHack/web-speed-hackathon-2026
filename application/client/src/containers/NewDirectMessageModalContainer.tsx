import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { lazyNamed } from "@web-speed-hackathon-2026/client/src/utils/lazy";

interface Props {
  id: string;
}

const NewDirectMessageModalPageLazy = lazyNamed(
  () =>
    import(
      /* webpackChunkName: "feature-new-dm-modal" */ "@web-speed-hackathon-2026/client/src/components/direct_message/NewDirectMessageModalPage"
    ),
  "NewDirectMessageModalPage",
);

export const NewDirectMessageModalContainer = ({ id }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleToggle = () => {
      setIsOpen(element.open);
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
        navigate(`/dm/${conversation.id}`);
      } catch {
        throw new Error("ユーザーが見つかりませんでした");
      }
    },
    [navigate],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      {isOpen ? (
        <Suspense fallback={null}>
          <NewDirectMessageModalPageLazy key={resetKey} id={id} onSubmit={handleSubmit} />
        </Suspense>
      ) : null}
    </Modal>
  );
};
