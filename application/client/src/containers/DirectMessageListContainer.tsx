import { useId } from "react";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";
import { AUTH_MODAL_ID } from "../utils/constants";

interface Props {
  activeUser: Models.User | null;
}

export const DirectMessageListContainer = ({ activeUser }: Props) => {
  const newDmModalId = useId();

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインが必要です"
        authModalId={AUTH_MODAL_ID}
      />
    );
  }

  return (
    <>
      <title>ダイレクトメッセージ - CaX</title>
      <DirectMessageListPage
        activeUser={activeUser}
        newDmModalId={newDmModalId}
      />
      <NewDirectMessageModalContainer id={newDmModalId} />
    </>
  );
};
