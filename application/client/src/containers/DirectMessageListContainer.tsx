import { useCallback, useEffect, useId, useRef } from "react";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";
import { setPageTitle } from "@web-speed-hackathon-2026/client/src/utils/set_page_title";

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageListContainer = ({ activeUser, authModalId }: Props) => {
  const newDmModalId = useId();
  const modalRef = useRef<HTMLDialogElement>(null);

  const handleOpenModal = useCallback(() => {
    modalRef.current?.showModal();
  }, []);

  useEffect(() => {
    setPageTitle("ダイレクトメッセージ - CaX");
  }, []);

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインが必要です"
        authModalId={authModalId}
      />
    );
  }

  return (
    <>
      <DirectMessageListPage activeUser={activeUser} newDmModalId={newDmModalId} onOpenNewDm={handleOpenModal} />
      <NewDirectMessageModalContainer id={newDmModalId} ref={modalRef} />
    </>
  );
};
