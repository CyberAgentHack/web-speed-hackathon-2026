import { useId } from "react";
import { Helmet } from "react-helmet";

import type { AuthStatus } from "@web-speed-hackathon-2026/client/src/auth/types";
import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";

interface Props {
  activeUser: Models.User | null;
  authStatus: AuthStatus;
  authModalId: string;
  onSessionExpired: () => void;
}

export const DirectMessageListContainer = ({
  activeUser,
  authStatus,
  authModalId,
  onSessionExpired,
}: Props) => {
  const newDmModalId = useId();

  if (authStatus === "loading") {
    return (
      <Helmet>
        <title>読込中 - CaX</title>
      </Helmet>
    );
  }

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
      <Helmet>
        <title>ダイレクトメッセージ - CaX</title>
      </Helmet>
      <DirectMessageListPage
        activeUser={activeUser}
        newDmModalId={newDmModalId}
        onSessionExpired={onSessionExpired}
      />
      <NewDirectMessageModalContainer id={newDmModalId} onSessionExpired={onSessionExpired} />
    </>
  );
};
