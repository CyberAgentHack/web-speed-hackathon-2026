import { useCallback, useEffect, useMemo, useState } from "react";

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

const relativeTimeFormatter = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

function formatRelativeTime(value: string): string {
  const target = new Date(value).getTime();
  const now = Date.now();
  const diffMs = target - now;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (Math.abs(diffMs) < hour) {
    return relativeTimeFormatter.format(Math.round(diffMs / minute), "minute");
  }

  if (Math.abs(diffMs) < day) {
    return relativeTimeFormatter.format(Math.round(diffMs / hour), "hour");
  }

  if (Math.abs(diffMs) < month) {
    return relativeTimeFormatter.format(Math.round(diffMs / day), "day");
  }

  if (Math.abs(diffMs) < year) {
    return relativeTimeFormatter.format(Math.round(diffMs / month), "month");
  }

  return relativeTimeFormatter.format(Math.round(diffMs / year), "year");
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
      const nextConversations =
        await fetchJSON<Array<Models.DirectMessageConversation>>("/api/v1/dm");
      setConversations(nextConversations);
      setError(null);
    } catch (nextError) {
      setConversations(null);
      setError(nextError as Error);
    }
  }, [activeUser]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useWs("/api/v1/dm/unread", () => {
    void loadConversations();
  });

  const renderedConversations = useMemo(() => {
    if (conversations == null) {
      return null;
    }

    return conversations.map((conversation) => {
      const { messages } = conversation;
      const peer =
        conversation.initiator.id !== activeUser.id ? conversation.initiator : conversation.member;

      const lastMessage = messages.at(-1);
      const hasUnread = messages
        .filter((message) => message.sender.id === peer.id)
        .some((message) => !message.isRead);

      return {
        conversation,
        hasUnread,
        lastMessage,
        peer,
      };
    });
  }, [activeUser.id, conversations]);

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
          {renderedConversations?.map(({ conversation, hasUnread, lastMessage, peer }) => {
            return (
              <li className="grid" key={conversation.id}>
                <Link className="hover:bg-cax-surface-subtle px-4" to={`/dm/${conversation.id}`}>
                  <div className="border-cax-border flex gap-4 border-b px-4 pt-2 pb-4">
                    <img
                      alt={peer.profileImage.alt}
                      className="h-12 w-12 shrink-0 self-start rounded-full object-cover"
                      decoding="async"
                      height={48}
                      loading="lazy"
                      src={getProfileImagePath(peer.profileImage.id, "thumb")}
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
                            dateTime={new Date(lastMessage.createdAt).toISOString()}
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