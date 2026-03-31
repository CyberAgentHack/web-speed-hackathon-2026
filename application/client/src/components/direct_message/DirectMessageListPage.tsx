import { useCallback, useEffect, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import { formatRelativeTime } from "@web-speed-hackathon-2026/client/src/utils/date";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface DirectMessageConversationSummary {
  id: string;
  initiator: Models.User;
  member: Models.User;
  lastMessage: Models.DirectMessage | null;
  hasUnread: boolean;
}

interface Props {
  activeUser: Models.User;
  onOpenNewDmModal: () => void;
}

export const DirectMessageListPage = ({ activeUser, onOpenNewDmModal }: Props) => {
  const [conversations, setConversations] = useState<Array<DirectMessageConversationSummary> | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);

  const loadConversations = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    try {
      const conversations = await fetchJSON<Array<DirectMessageConversationSummary>>("/api/v1/dm");
      setConversations(conversations);
      setError(null);
    } catch (error) {
      setConversations(null);
      setError(error as Error);
    }
  }, [activeUser]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useWs("/api/v1/dm/unread", () => {
    void loadConversations();
  });

  if (conversations == null && error == null) {
    return null;
  }

  const conversationList = conversations ?? [];

  return (
    <section>
      <header className="border-cax-border flex flex-col gap-4 border-b px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">ダイレクトメッセージ</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            leftItem={<FontAwesomeIcon iconType="paper-plane" styleType="solid" />}
            onClick={onOpenNewDmModal}
          >
            新しくDMを始める
          </Button>
        </div>
      </header>

      {error != null ? (
        <p className="text-cax-danger px-4 py-6 text-center text-sm">DMの取得に失敗しました</p>
      ) : conversationList.length === 0 ? (
        <p className="text-cax-text-muted px-4 py-6 text-center">
          まだDMで会話した相手がいません。
        </p>
      ) : (
        <ul data-testid="dm-list">
          {conversationList.map((conversation) => {
            const peer =
              conversation.initiator.id !== activeUser.id
                ? conversation.initiator
                : conversation.member;
            const { hasUnread, lastMessage } = conversation;

            return (
              <li className="grid" key={conversation.id}>
                <Link className="hover:bg-cax-surface-subtle px-4" to={`/dm/${conversation.id}`}>
                  <div className="border-cax-border flex gap-4 border-b px-4 pt-2 pb-4">
                    <img
                      alt={peer.profileImage.alt}
                      className="w-12 shrink-0 self-start rounded-full"
                      src={getProfileImagePath(peer.profileImage.id)}
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{peer.name}</p>
                          <p className="text-cax-text-muted text-xs">@{peer.username}</p>
                        </div>
                        {lastMessage != null && (
                          <time
                            className="text-cax-text-subtle text-xs"
                            dateTime={lastMessage.createdAt}
                          >
                            {formatRelativeTime(lastMessage.createdAt)}
                          </time>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm wrap-anywhere">{lastMessage?.body}</p>
                      {hasUnread ? (
                        <span className="bg-cax-brand-soft text-cax-brand mt-2 inline-flex w-fit rounded-full px-3 py-0.5 text-xs">
                          未読
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
