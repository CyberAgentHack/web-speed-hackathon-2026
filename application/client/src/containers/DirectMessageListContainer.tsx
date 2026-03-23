import { useId } from "react";
import { Helmet } from "react-helmet";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
  isResolvingActiveUser: boolean;
}

export const DirectMessageListContainer = ({
  activeUser,
  authModalId,
  isResolvingActiveUser,
}: Props) => {
  const newDmModalId = useId();

  if (activeUser === null && isResolvingActiveUser) {
    return (
      <>
        <Helmet>
          <title>ダイレクトメッセージ - CaX</title>
        </Helmet>
        <section className="px-6 py-10">
          <p className="text-cax-text-muted text-sm">DM情報を読み込んでいます...</p>
        </section>
      </>
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
      <DirectMessageListPage activeUser={activeUser} newDmModalId={newDmModalId} />
      <NewDirectMessageModalContainer id={newDmModalId} />
    </>
  );
};
