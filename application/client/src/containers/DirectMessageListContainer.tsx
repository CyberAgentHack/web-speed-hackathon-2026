import { useId } from "react";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { useTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_title";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
}

export const DirectMessageListContainer = ({ activeUser, authModalId }: Props) => {
  const newDmModalId = useId();
  const { data: conversations, error, isLoading, fetchMore, hasMore, reset } =
    useInfiniteFetch<Models.DirectMessageConversation>("/api/v1/dm", fetchJSON, { initialLimit: 15 });

  useWs("/api/v1/dm/unread", () => {
    reset();
  });

  useTitle("ダイレクトメッセージ - CaX");

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
      <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} items={conversations}>
        <DirectMessageListPage
          activeUser={activeUser}
          newDmModalId={newDmModalId}
          conversations={conversations}
          error={error}
          isLoading={isLoading}
        />
      </InfiniteScroll>
      <NewDirectMessageModalContainer id={newDmModalId} />
    </>
  );
};
