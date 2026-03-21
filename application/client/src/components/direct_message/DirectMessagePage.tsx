import classNames from "classnames";
import {
  ChangeEvent,
  useCallback,
  memo,
  useId,
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
  FormEvent,
} from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { formatJapaneseTime } from "@web-speed-hackathon-2026/client/src/utils/format_date";
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

interface MessageListProps {
  activeUserId: string;
  messages: Models.DirectMessage[];
}

const DirectMessageMessageList = memo(({ activeUserId, messages }: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <p className="text-cax-text-muted text-center text-sm">
        まだメッセージはありません。最初のメッセージを送信してみましょう。
      </p>
    );
  }

  return (
    <ul className="grid gap-3" data-testid="dm-message-list">
      {messages.map((message) => {
        const isActiveUserSend = message.sender.id === activeUserId;

        return (
          <li
            className={classNames(
              "flex w-full flex-col",
              isActiveUserSend ? "items-end" : "items-start",
            )}
            key={message.id}
          >
            <p
              className={classNames(
                "max-w-3/4 rounded-xl border px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere",
                isActiveUserSend
                  ? "rounded-br-sm border-transparent bg-cax-brand text-cax-surface-raised"
                  : "rounded-bl-sm border-cax-border bg-cax-surface text-cax-text",
              )}
            >
              {message.body}
            </p>
            <div className="flex gap-1 text-xs">
              <time dateTime={message.createdAt}>{formatJapaneseTime(message.createdAt)}</time>
              {isActiveUserSend && message.isRead && (
                <span className="text-cax-text-muted">既読</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
});

DirectMessageMessageList.displayName = "DirectMessageMessageList";

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textAreaId = useId();

  const peer =
    conversation.initiator.id !== activeUser.id ? conversation.initiator : conversation.member;

  const [text, setText] = useState("");
  const textAreaRows = Math.min((text || "").split("\n").length, 5);
  const isInvalid = text.trim().length === 0;
  const lastMessageId = conversation.messages.at(-1)?.id ?? "";

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

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container == null) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [conversation.id, lastMessageId]);

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
          decoding="async"
          fetchPriority="auto"
          loading="eager"
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

      <div
        className="bg-cax-surface-subtle flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-8"
        ref={messagesContainerRef}
      >
        <DirectMessageMessageList
          activeUserId={activeUser.id}
          messages={conversation.messages}
        />
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
