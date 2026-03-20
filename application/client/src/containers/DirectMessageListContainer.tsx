import { useId } from "react";
import { Helmet } from "react-helmet";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";

interface Props {
  activeUser: Models.User | null;
  isLoadingActiveUser: boolean;
  onOpenAuthModal: () => void;
}

export const DirectMessageListContainer = ({
  activeUser,
  isLoadingActiveUser,
  onOpenAuthModal,
}: Props) => {
  const newDmModalId = useId();

  if (isLoadingActiveUser) {
    return (
      <section className="space-y-4 px-6 py-12 text-center">
        <Helmet>
          <title>ダイレクトメッセージ - CaX</title>
        </Helmet>
        <p className="text-cax-text-muted text-sm">読み込み中...</p>
      </section>
    );
  }

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
