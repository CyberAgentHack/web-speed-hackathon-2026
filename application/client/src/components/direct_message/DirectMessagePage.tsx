import classNames from "classnames";
import {
  ChangeEvent,
  useCallback,
  useLayoutEffect,
  useMemo,
  useId,
  useRef,
  useState,
  KeyboardEvent,
  FormEvent,
  useEffect,
} from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { formatTimeHHmm } from "@web-speed-hackathon-2026/client/src/utils/format_date";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  conversationError: Error | null;
  conversation: Models.DirectMessageConversation;
  activeUser: Models.User;
  isPeerTyping: boolean;
  isSubmitting: boolean;
  onTyping: () => void;
  onSubmit: (params: DirectMessageFormData) => Promise<void>;
}

const MESSAGE_PAGE_SIZE = 30;
const LOAD_MORE_SCROLL_THRESHOLD_PX = 48;

export const DirectMessagePage = ({
  conversationError,
  conversation,
  activeUser,
  isPeerTyping,
  isSubmitting,
  onTyping,
  onSubmit,
}: Props) => {
  const formRef = useRef<HTMLFormElement>(null);
  const prevReachedTopRef = useRef(false);
  const isPrependingRef = useRef(false);
  const previousBodyHeightRef = useRef<number | null>(null);
  const textAreaId = useId();

  const peer =
    conversation.initiator.id !== activeUser.id ? conversation.initiator : conversation.member;

  const [text, setText] = useState("");
  const [renderCount, setRenderCount] = useState(MESSAGE_PAGE_SIZE);
  const textAreaRows = Math.min((text || "").split("\n").length, 5);
  const isInvalid = text.trim().length === 0;
  const sortedMessages = useMemo(() => {
    return [...conversation.messages].sort((a, b) => {
      const createdAtDiff = Date.parse(a.createdAt) - Date.parse(b.createdAt);
      if (createdAtDiff !== 0) {
        return createdAtDiff;
      }
      return a.id.localeCompare(b.id);
    });
  }, [conversation.messages]);
  const renderedMessages = useMemo(() => {
    return sortedMessages.slice(Math.max(0, sortedMessages.length - renderCount));
  }, [sortedMessages, renderCount]);
  const hasOlderMessages = renderCount < sortedMessages.length;

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
      void onSubmit({ body: text.trim() }).then(() => {
        setText("");
      });
    },
    [onSubmit, text],
  );

  const handleLoadOlderMessages = useCallback(() => {
    if (!hasOlderMessages) {
      return;
    }
    isPrependingRef.current = true;
    previousBodyHeightRef.current = document.body.offsetHeight;
    setRenderCount((current) => Math.min(current + MESSAGE_PAGE_SIZE, sortedMessages.length));
  }, [hasOlderMessages, sortedMessages.length]);

  useEffect(() => {
    const handler = () => {
      const hasReachedTop = Math.ceil(window.scrollY) <= LOAD_MORE_SCROLL_THRESHOLD_PX;

      if (hasReachedTop && !prevReachedTopRef.current && hasOlderMessages) {
        handleLoadOlderMessages();
      }

      prevReachedTopRef.current = hasReachedTop;
    };

    prevReachedTopRef.current = false;
    handler();

    document.addEventListener("resize", handler, { passive: false });
    document.addEventListener("scroll", handler, { passive: false });
    return () => {
      document.removeEventListener("resize", handler);
      document.removeEventListener("scroll", handler);
    };
  }, [hasOlderMessages, handleLoadOlderMessages]);

  useEffect(() => {
    setRenderCount(MESSAGE_PAGE_SIZE);
  }, [conversation.id]);

  useLayoutEffect(() => {
    if (!isPrependingRef.current) {
      return;
    }
    const previousBodyHeight = previousBodyHeightRef.current;
    if (previousBodyHeight != null) {
      const addedHeight = document.body.offsetHeight - previousBodyHeight;
      window.scrollTo(0, window.scrollY + addedHeight);
    }
    isPrependingRef.current = false;
    previousBodyHeightRef.current = null;
  }, [renderedMessages.length]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    return () => {
      window.cancelAnimationFrame(id);
    };
  }, [conversation.messages.length, isPeerTyping]);

  if (conversationError != null) {
    return (
      <section className="px-6 py-10">
        <p className="text-cax-danger text-sm">メッセージの取得に失敗しました</p>
      </section>
    );
  }

  return (
    <section className="bg-cax-surface flex min-h-[calc(100vh-(--spacing(12)))] flex-col lg:min-h-screen">
      <header className="border-cax-border bg-cax-surface sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3">
        <img
          alt={peer.profileImage.alt}
          className="h-12 w-12 rounded-full object-cover"
          loading="lazy"
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

      <div className="bg-cax-surface-subtle flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-8">
        {sortedMessages.length === 0 && (
          <p className="text-cax-text-muted text-center text-sm">
            まだメッセージはありません。最初のメッセージを送信してみましょう。
          </p>
        )}

        <ul className="grid gap-3" data-testid="dm-message-list">
          {renderedMessages.map((message) => {
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
                  <time dateTime={message.createdAt}>{formatTimeHHmm(message.createdAt)}</time>
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
