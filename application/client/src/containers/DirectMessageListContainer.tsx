import { useSuspenseQuery } from "@tanstack/react-query";

import { getMeQueryOptions } from "@web-speed-hackathon-2026/client/src/auth/hooks";
import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";
import { MODAL_IDS } from "@web-speed-hackathon-2026/client/src/constants";

export const DirectMessageListContainer = () => {
  const { data: activeUser } = useSuspenseQuery(getMeQueryOptions());

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインが必要です"
      />
    );
  }

  return (
    <>
      <title>ダイレクトメッセージ - CaX</title>
      <DirectMessageListPage activeUser={activeUser} newDmModalId={MODAL_IDS.NEW_DM} />
      <NewDirectMessageModalContainer id={MODAL_IDS.NEW_DM} />
    </>
  );
};
