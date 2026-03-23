const jaRelativeFormat = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return jaRelativeFormat.format(-seconds, "second");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return jaRelativeFormat.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return jaRelativeFormat.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  return jaRelativeFormat.format(-days, "day");
}
import { useCallback, useEffect, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  activeUser: Models.User;
  newDmModalId: string;
}

export const DirectMessageListPage = ({ activeUser, newDmModalId }: Props) => {
  const [conversations, setConversations] =
    useState<Array<Models.DirectMessageConversation> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadConversations = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    try {
      const conversations = await fetchJSON<Array<Models.DirectMessageConversation>>("/api/v1/dm");
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

  if (conversations == null) {
    return null;
  }

  return (
    <section>
      <header className="border-cax-border flex flex-col gap-4 border-b px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">ダイレクトメッセージ</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            command="show-modal"
            commandfor={newDmModalId}
            leftItem={<FontAwesomeIcon iconType="paper-plane" styleType="solid" />}
          >
            新しくDMを始める
          </Button>
        </div>
      </header>

      {error != null ? (
        <p className="text-cax-danger px-4 py-6 text-center text-sm">DMの取得に失敗しました</p>
      ) : conversations.length === 0 ? (
        <p className="text-cax-text-muted px-4 py-6 text-center">
          まだDMで会話した相手がいません。
        </p>
      ) : (
        <ul data-testid="dm-list">
          {conversations.map((conversation) => {
            const { messages } = conversation;
            const peer =
              conversation.initiator.id !== activeUser.id
                ? conversation.initiator
                : conversation.member;

            const lastMessage = messages.at(-1);
            const hasUnread = (conversation as any).hasUnread ?? messages
              .filter((m) => m.sender.id === peer.id)
              .some((m) => !m.isRead);

            return (
              <li className="grid" key={conversation.id}>
                <Link className="hover:bg-cax-surface-subtle px-4" to={`/dm/${conversation.id}`}>
                  <div className="border-cax-border flex gap-4 border-b px-4 pt-2 pb-4">
                    <img
                      alt={peer.profileImage.alt}
                      className="w-12 shrink-0 self-start rounded-full"
                      height={48}
                      src={getProfileImagePath(peer.profileImage.id)}
                      width={48}
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
