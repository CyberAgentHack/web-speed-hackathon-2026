import { useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";

import { getMeQueryOptions } from "@web-speed-hackathon-2026/client/src/auth/hooks";
import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { MODAL_IDS } from "@web-speed-hackathon-2026/client/src/constants";

const NewDirectMessageModalContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer").then(
    (m) => ({
      default: m.NewDirectMessageModalContainer,
    }),
  ),
);

export const DirectMessageListContainer = () => {
  const { data: activeUser } = useSuspenseQuery(getMeQueryOptions());

  if (activeUser === null) {
    return <DirectMessageGate headline="DMを利用するにはサインインが必要です" />;
  }

  return (
    <>
      <title>ダイレクトメッセージ - CaX</title>
      <DirectMessageListPage activeUser={activeUser} newDmModalId={MODAL_IDS.NEW_DM} />
      <Suspense>
        <NewDirectMessageModalContainer id={MODAL_IDS.NEW_DM} />
      </Suspense>
    </>
  );
};
