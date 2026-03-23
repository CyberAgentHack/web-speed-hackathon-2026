import classNames from "classnames";
import { formatHM } from "@web-speed-hackathon-2026/client/src/utils/date_format";
import {
  ChangeEvent,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  KeyboardEvent,
  FormEvent,
  useEffect,
} from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface ConversationMeta {
  id: string;
  initiator: Models.User;
  member: Models.User;
}

interface Props {
  conversationError: Error | null;
  conversationMeta: ConversationMeta;
  messages: Models.DirectMessage[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  scrollTrigger: number;
  activeUser: Models.User;
  isPeerTyping: boolean;
  isSubmitting: boolean;
  onTyping: () => void;
  onSubmit: (params: DirectMessageFormData) => Promise<void>;
}

export const DirectMessagePage = ({
  conversationError,
  conversationMeta,
  messages,
  hasMore,
  isLoadingMore,
  onLoadMore,
  scrollTrigger,
  activeUser,
  isPeerTyping,
  isSubmitting,
  onTyping,
  onSubmit,
}: Props) => {
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaId = useId();
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const peer =
    conversationMeta.initiator.id !== activeUser.id
      ? conversationMeta.initiator
      : conversationMeta.member;

  const [text, setText] = useState("");
  const textAreaRows = Math.min((text || "").split("\n").length, 5);
  const isInvalid = text.trim().length === 0;

  // scrollTrigger が変わったら最下部にスクロール（初回ロード・新着メッセージ）
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [scrollTrigger]);

  // isLoadingMore が true→false になった直後（アイテム追加後）に scrollY を調整して
  // 上部センチネルが viewport から外れるようにする
  const prevIsLoadingMoreRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  useLayoutEffect(() => {
    if (
      prevIsLoadingMoreRef.current &&
      !isLoadingMore &&
      prevScrollHeightRef.current > 0
    ) {
      window.scrollTo(
        0,
        window.scrollY + document.body.scrollHeight - prevScrollHeightRef.current,
      );
    }

    prevIsLoadingMoreRef.current = isLoadingMore;
    prevScrollHeightRef.current = document.body.scrollHeight;
  }, [isLoadingMore, messages]);

  // 上部センチネルが見えたら古いメッセージを読み込む
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (sentinel == null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
      onTyping();
    },
    [onTyping],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing
      ) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void onSubmit({ body: text.trim() }).then(() => {
        setText("");
      });
    },
    [onSubmit, text],
  );

  if (conversationError != null) {
    return (
      <section className="px-6 py-10">
        <p className="text-cax-danger text-sm">
          メッセージの取得に失敗しました
        </p>
      </section>
    );
  }

  return (
    <section className="bg-cax-surface flex min-h-[calc(100vh-(--spacing(12)))] flex-col lg:min-h-screen">
      <header className="border-cax-border bg-cax-surface sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3">
        <img
          alt={peer.profileImage.alt}
          className="h-12 w-12 rounded-full object-cover"
          height={48}
          width={48}
          src={getProfileImagePath(peer.profileImage.id)}
        />
        <div className="min-w-0">
          <h1 className="overflow-hidden text-xl font-bold text-ellipsis whitespace-nowrap">
            {peer.name}
          </h1>
          <p className="text-cax-text-muted overflow-hidden text-xs text-ellipsis whitespace-nowrap">
            @{peer.username}
          </p>
        </div>
      </header>

      <div className="bg-cax-surface-subtle flex-1 px-4 pt-4 pb-8">
        {/* 上部センチネル：見えたら古いメッセージを読み込む */}
        <div ref={topSentinelRef} />

        {isLoadingMore && (
          <p className="text-cax-text-muted py-2 text-center text-xs">
            読み込み中…
          </p>
        )}

        {messages.length === 0 && !isLoadingMore && (
          <p className="text-cax-text-muted text-center text-sm">
            まだメッセージはありません。最初のメッセージを送信してみましょう。
          </p>
        )}

        <ul className="grid gap-3" data-testid="dm-message-list">
          {messages.map((message) => {
            const isActiveUserSend = message.sender.id === activeUser.id;

            return (
              <li
                key={message.id}
                className={classNames(
                  "flex flex-col w-full",
                  isActiveUserSend ? "items-end" : "items-start",
                )}
              >
                <p
                  className={classNames(
                    "max-w-3/4 rounded-xl border px-4 py-2 text-sm whitespace-pre-wrap leading-relaxed wrap-anywhere",
                    isActiveUserSend
                      ? "rounded-br-sm border-transparent bg-cax-brand text-cax-surface-raised"
                      : "rounded-bl-sm border-cax-border bg-cax-surface text-cax-text",
                  )}
                >
                  {message.body}
                </p>
                <div className="flex gap-1 text-xs">
                  <time dateTime={message.createdAt}>
                    {formatHM(message.createdAt)}
                  </time>
                  {isActiveUserSend && message.isRead && (
                    <span className="text-cax-text-muted">既読</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* 下部センチネル：初回ロード・新着時にここへスクロール */}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-12 z-10 lg:bottom-0">
        {isPeerTyping && (
          <p className="bg-cax-surface-raised/75 text-cax-brand absolute inset-x-0 top-0 -translate-y-full px-4 py-1 text-xs">
            <span className="font-bold">{peer.name}</span>さんが入力中…
          </p>
        )}

        <form
          className="border-cax-border bg-cax-surface flex items-end gap-2 border-t p-4"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <div className="flex grow">
            <label className="sr-only" htmlFor={textAreaId}>
              内容
            </label>
            <textarea
              id={textAreaId}
              className="border-cax-border placeholder-cax-text-subtle focus:outline-cax-brand w-full resize-none rounded-xl border px-3 py-2 focus:outline-2 focus:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              rows={textAreaRows}
              disabled={isSubmitting}
            />
          </div>
          <button
            className="bg-cax-brand text-cax-surface-raised hover:bg-cax-brand-strong rounded-full px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isInvalid || isSubmitting}
            type="submit"
          >
            <FontAwesomeIcon iconType="arrow-right" styleType="solid" />
          </button>
        </form>
      </div>
    </section>
  );
};
