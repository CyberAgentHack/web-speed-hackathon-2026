import classNames from "classnames";
import {
  ChangeEvent,
  useCallback,
  useId,
  useRef,
  useState,
  KeyboardEvent,
  FormEvent,
  useEffect,
  useLayoutEffect,
} from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const dtf = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });

interface Props {
  conversationInfo: Models.DirectMessageConversation | null;
  messages: Models.DirectMessage[];
  hasMore: boolean;
  isLoadingMessages: boolean;
  onLoadOlderMessages: () => void;
  conversationError: Error | null;
  activeUser: Models.User;
  isPeerTyping: boolean;
  isSubmitting: boolean;
  onTyping: () => void;
  onSubmit: (params: DirectMessageFormData) => Promise<void>;
}

export const DirectMessagePage = ({
  conversationInfo,
  messages,
  hasMore,
  isLoadingMessages,
  onLoadOlderMessages,
  conversationError,
  activeUser,
  isPeerTyping,
  isSubmitting,
  onTyping,
  onSubmit,
}: Props) => {
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaId = useId();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevFirstMessageIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef<number>(0);

  // Refs to avoid recreating scroll handler on every state change
  const hasMoreRef = useRef(hasMore);
  const isLoadingMessagesRef = useRef(isLoadingMessages);
  const onLoadOlderMessagesRef = useRef(onLoadOlderMessages);
  const isLoadingOlderRef = useRef(false);

  const peer = conversationInfo
    ? conversationInfo.initiator.id !== activeUser.id
      ? conversationInfo.initiator
      : conversationInfo.member
    : null;

  const [text, setText] = useState("");
  const textAreaRows = Math.min((text || "").split("\n").length, 5);
  const isInvalid = text.trim().length === 0;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
      onTyping();
    },
    [onTyping],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [formRef],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const body = text.trim();
      if (!body) return;
      setText("");
      void onSubmit({ body });
    },
    [onSubmit, text],
  );

  // Scroll position preservation
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;

    const prevFirstId = prevFirstMessageIdRef.current;
    const prevCount = prevMessageCountRef.current;
    const currentFirstId = messages[0]!.id;

    if (prevCount === 0) {
      // Initial load: scroll to bottom
      container.scrollTop = container.scrollHeight;
    } else if (prevFirstId !== currentFirstId && messages.length > prevCount) {
      // Prepend (older messages loaded): maintain scroll position
      const prevScrollHeight = container.dataset["prevScrollHeight"];
      if (prevScrollHeight) {
        const diff = container.scrollHeight - Number(prevScrollHeight);
        container.scrollTop += diff;
      }
    } else if (messages.length > prevCount) {
      // Append (new message): scroll to bottom
      container.scrollTop = container.scrollHeight;
    }

    prevFirstMessageIdRef.current = currentFirstId;
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // Save scrollHeight before DOM update for prepend detection
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.dataset["prevScrollHeight"] = String(container.scrollHeight);
    }
  });

  // Keep refs in sync
  useEffect(() => {
    hasMoreRef.current = hasMore;
    isLoadingMessagesRef.current = isLoadingMessages;
    onLoadOlderMessagesRef.current = onLoadOlderMessages;
  });

  // Reset loading guard when loading completes
  useEffect(() => {
    if (!isLoadingMessages) {
      isLoadingOlderRef.current = false;
    }
  }, [isLoadingMessages]);

  // Scroll-based loading of older messages
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (
        container.scrollTop < 200 &&
        hasMoreRef.current &&
        !isLoadingMessagesRef.current &&
        !isLoadingOlderRef.current
      ) {
        isLoadingOlderRef.current = true;
        container.dataset["prevScrollHeight"] = String(container.scrollHeight);
        onLoadOlderMessagesRef.current();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  if (conversationError != null) {
    return (
      <section className="px-6 py-10">
        <p className="text-cax-danger text-sm">メッセージの取得に失敗しました</p>
      </section>
    );
  }

  return (
    <section className="bg-cax-surface flex h-[calc(100vh-(--spacing(12)))] flex-col overflow-hidden lg:h-screen">
      <header className="border-cax-border bg-cax-surface sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3">
        {peer ? (
          <>
            <img
              alt={peer.profileImage.alt}
              className="h-12 w-12 rounded-full object-cover"
              height={96}
              src={getProfileImagePath(peer.profileImage.id, 96)}
              width={96}
            />
            <div className="min-w-0">
              <h1 className="overflow-hidden text-xl font-bold text-ellipsis whitespace-nowrap">
                {peer.name}
              </h1>
              <p className="text-cax-text-muted overflow-hidden text-xs text-ellipsis whitespace-nowrap">
                @{peer.username}
              </p>
            </div>
          </>
        ) : (
          <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
        )}
      </header>

      <div
        ref={scrollContainerRef}
        data-dm-scroll
        className="bg-cax-surface-subtle flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-8"
      >
        {isLoadingMessages && messages.length > 0 && (
          <div className="flex justify-center py-2">
            <span className="text-cax-text-muted animate-spin text-lg">
              <FontAwesomeIcon iconType="circle-notch" styleType="solid" />
            </span>
          </div>
        )}

        {isLoadingMessages && messages.length === 0 && (
          <div className="flex justify-center py-4">
            <span className="text-cax-text-muted animate-spin text-xl">
              <FontAwesomeIcon iconType="circle-notch" styleType="solid" />
            </span>
          </div>
        )}

        {!isLoadingMessages && messages.length === 0 && (
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
                    {dtf.format(new Date(message.createdAt))}
                  </time>
                  {isActiveUserSend && message.isRead && (
                    <span className="text-cax-text-muted">既読</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sticky bottom-12 z-10 lg:bottom-0">
        {isPeerTyping && peer && (
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
