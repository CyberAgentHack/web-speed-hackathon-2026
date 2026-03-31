import { useEffect, useId, useState } from "react";
import { Helmet } from "react-helmet";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";

interface Props {
  activeUser: Models.User | null;
  onRequestAuthModal: () => void;
}

export const DirectMessageListContainer = ({ activeUser, onRequestAuthModal }: Props) => {
  const newDmModalId = useId();
  const [newDmOpenRequestKey, setNewDmOpenRequestKey] = useState(0);

  useEffect(() => {
    if (activeUser === null) {
      setNewDmOpenRequestKey(0);
    }
  }, [activeUser]);

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインが必要です"
        onRequestAuthModal={onRequestAuthModal}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>ダイレクトメッセージ - CaX</title>
      </Helmet>
      <DirectMessageListPage
        activeUser={activeUser}
        onRequestNewDmModal={() => {
          setNewDmOpenRequestKey((key) => key + 1);
        }}
      />
      <NewDirectMessageModalContainer id={newDmModalId} openRequestKey={newDmOpenRequestKey} />
    </>
  );
};
