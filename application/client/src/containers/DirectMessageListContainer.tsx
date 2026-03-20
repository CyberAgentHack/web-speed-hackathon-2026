import { useId } from "react";
import { Helmet } from "react-helmet";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";

interface Props {
  activeUser: Models.User | null;
  onOpenAuthModal: () => void;
}

export const DirectMessageListContainer = ({ activeUser, onOpenAuthModal }: Props) => {
  const newDmModalId = useId();

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインが必要です"
        onOpenAuthModal={onOpenAuthModal}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>ダイレクトメッセージ - CaX</title>
      </Helmet>
      <DirectMessageListPage activeUser={activeUser} newDmModalId={newDmModalId} />
      <NewDirectMessageModalContainer id={newDmModalId} />
    </>
  );
};
