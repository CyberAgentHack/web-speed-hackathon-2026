import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { Link } from "@web-speed-hackathon-2026/client/src/components/foundation/Link";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const rtf = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

interface Props {
  activeUser: Models.User;
  newDmModalId: string;
  conversations: Array<Models.DirectMessageConversation>;
  error: Error | null;
  isLoading: boolean;
}

export const DirectMessageListPage = ({ activeUser, newDmModalId, conversations, error, isLoading }: Props) => {
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

      {conversations.length === 0 && isLoading ? (
        <div className="flex justify-center py-12">
          <span className="text-cax-text-muted animate-spin text-2xl">
            <FontAwesomeIcon iconType="circle-notch" styleType="solid" />
          </span>
        </div>
      ) : error != null ? (
        <p className="text-cax-danger px-4 py-6 text-center text-sm">DMの取得に失敗しました</p>
      ) : conversations.length === 0 ? (
        <p className="text-cax-text-muted px-4 py-6 text-center">
          まだDMで会話した相手がいません。
        </p>
      ) : (
        <ul data-testid="dm-list">
          {conversations.map((conversation) => {
            const messages = conversation.messages ?? [];
            const peer =
              conversation.initiator.id !== activeUser.id
                ? conversation.initiator
                : conversation.member;

            const lastMessage = messages.at(-1);
            const hasUnread = conversation.hasUnread ?? false;

            return (
              <li className="grid" key={conversation.id}>
                <Link className="hover:bg-cax-surface-subtle px-4" to={`/dm/${conversation.id}`}>
                  <div className="border-cax-border flex gap-4 border-b px-4 pt-2 pb-4">
                    <img
                      alt={peer.profileImage.alt}
                      className="w-12 shrink-0 self-start rounded-full"
                      height={96}
                      loading="lazy"
                      src={getProfileImagePath(peer.profileImage.id, 96)}
                      width={96}
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
                            {(() => {
                              const diff = Date.now() - new Date(lastMessage.createdAt).getTime();
                              const seconds = Math.floor(diff / 1000);
                              const minutes = Math.floor(seconds / 60);
                              const hours = Math.floor(minutes / 60);
                              const days = Math.floor(hours / 24);
                              if (days > 0) return rtf.format(-days, "day");
                              if (hours > 0) return rtf.format(-hours, "hour");
                              if (minutes > 0) return rtf.format(-minutes, "minute");
                              return rtf.format(-seconds, "second");
                            })()}
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
