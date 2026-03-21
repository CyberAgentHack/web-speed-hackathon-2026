import { memo, useCallback, useEffect, useState } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { formatRelative } from "@web-speed-hackathon-2026/client/src/utils/format_date";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  activeUser: Models.User;
  newDmModalId: string;
}

interface DirectMessageConversationSummary
  extends Models.DirectMessageConversation {
  hasUnread?: boolean;
}

interface DirectMessageConversationListItemProps {
  conversationId: string;
  hasUnread: boolean;
  lastMessageBody?: string;
  lastMessageCreatedAt?: string;
  peerName: string;
  peerProfileImageAlt: string;
  peerProfileImageId: string;
  peerUsername: string;
}

const DirectMessageConversationListItemComponent = ({
  conversationId,
  hasUnread,
  lastMessageBody,
  lastMessageCreatedAt,
  peerName,
  peerProfileImageAlt,
  peerProfileImageId,
  peerUsername,
}: DirectMessageConversationListItemProps) => {
  return (
    <li className="grid">
      <Link
        className="hover:bg-cax-surface-subtle px-4"
        to={`/dm/${conversationId}`}
      >
        <div className="border-cax-border flex gap-4 border-b px-4 pt-2 pb-4">
          <img
            alt={peerProfileImageAlt}
            className="w-12 shrink-0 self-start rounded-full"
            height={48}
            loading="lazy"
            src={getProfileImagePath(peerProfileImageId)}
            width={48}
          />
          <div className="flex flex-1 flex-col">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{peerName}</p>
                <p className="text-cax-text-muted text-xs">@{peerUsername}</p>
              </div>
              {lastMessageCreatedAt != null && (
                <time
                  className="text-cax-text-subtle text-xs"
                  dateTime={lastMessageCreatedAt}
                >
                  {formatRelative(lastMessageCreatedAt)}
                </time>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-sm wrap-anywhere">
              {lastMessageBody}
            </p>
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
};

const DirectMessageConversationListItem = memo(
  DirectMessageConversationListItemComponent,
);
DirectMessageConversationListItem.displayName =
  "DirectMessageConversationListItem";

export const DirectMessageListPage = ({ activeUser, newDmModalId }: Props) => {
  const [conversations, setConversations] =
    useState<Array<DirectMessageConversationSummary> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadConversations = useCallback(async () => {
    if (activeUser == null) {
      return;
    }

    try {
      const conversations =
        await fetchJSON<Array<DirectMessageConversationSummary>>("/api/v1/dm");
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
            leftItem={
              <FontAwesomeIcon iconType="paper-plane" styleType="solid" />
            }
          >
            新しくDMを始める
          </Button>
        </div>
      </header>

      {error != null ? (
        <p className="text-cax-danger px-4 py-6 text-center text-sm">
          DMの取得に失敗しました
        </p>
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
            const lastMessage = messages[0];
            const hasUnread = conversation.hasUnread ?? false;

            return (
              <DirectMessageConversationListItem
                conversationId={conversation.id}
                hasUnread={hasUnread}
                key={conversation.id}
                lastMessageBody={lastMessage?.body}
                lastMessageCreatedAt={lastMessage?.createdAt}
                peerName={peer.name}
                peerProfileImageAlt={peer.profileImage.alt}
                peerProfileImageId={peer.profileImage.id}
                peerUsername={peer.username}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
};
