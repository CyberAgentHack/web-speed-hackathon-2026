import { useEffect, useId } from "react";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/foundation/PageTitle";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageListContainer = ({ activeUser, authModalId }: Props) => {
  const newDmModalId = useId();

  // Prefetch DirectMessageContainer chunk so navigation to /dm/:id is instant
  useEffect(() => {
    void import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer");
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
      <PageTitle title="ダイレクトメッセージ - CaX" />
      <DirectMessageListPage activeUser={activeUser} newDmModalId={newDmModalId} />
      <NewDirectMessageModalContainer id={newDmModalId} />
    </>
  );
};
