import classNames from "classnames";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { formatHM } from "@web-speed-hackathon-2026/client/src/utils/date_format";
import { getSafeProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  conversationError: Error | null;
  conversation: Models.DirectMessageConversation;
  activeUser: Models.User;
  isPeerTyping: boolean;
  isLoadingOlderMessages: boolean;
  isSubmitting: boolean;
  onLoadOlderMessages: () => Promise<void>;
  onTyping: () => void;
  onSubmit: (params: DirectMessageFormData) => Promise<void>;
}

interface MessageListProps {
  activeUserId: string;
  conversation: Models.DirectMessageConversation;
  isLoadingOlderMessages: boolean;
  messageListContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onLoadOlderMessages: () => Promise<void>;
}

interface ComposerProps {
  conversationId: string;
  isPeerTyping: boolean;
  isSubmitting: boolean;
  onSubmit: (params: DirectMessageFormData) => Promise<void>;
  onTyping: () => void;
  peerName: string;
  stickyBarRef: RefObject<HTMLDivElement | null>;
  textAreaId: string;
}

const DirectMessageRow = memo(
  ({ activeUserId, message }: { activeUserId: string; message: Models.DirectMessage }) => {
    const isActiveUserSend = message.sender.id === activeUserId;

    return (
      <li
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
          <time dateTime={message.createdAt}>{formatHM(message.createdAt)}</time>
          {isActiveUserSend && message.isRead ? (
            <span className="text-cax-text-muted">既読</span>
          ) : null}
        </div>
      </li>
    );
  },
);

const DirectMessageMessageList = memo(
  ({
    activeUserId,
    conversation,
    isLoadingOlderMessages,
    messageListContainerRef,
    messagesEndRef,
    onLoadOlderMessages,
  }: MessageListProps) => {
    const handleClickLoadOlderMessages = useCallback(() => {
      void onLoadOlderMessages();
    }, [onLoadOlderMessages]);

    return (
      <div
        className="bg-cax-surface-subtle flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-8"
        ref={messageListContainerRef}
      >
        {conversation.hasOlderMessages ? (
          <div className="flex justify-center">
            <Button
              className="text-sm"
              disabled={isLoadingOlderMessages}
              onClick={handleClickLoadOlderMessages}
              variant="secondary"
            >
              {isLoadingOlderMessages ? "読み込み中..." : "以前のメッセージを読み込む"}
            </Button>
          </div>
        ) : null}

        {conversation.messages.length === 0 ? (
          <p className="text-cax-text-muted text-center text-sm">
            まだメッセージはありません。最初のメッセージを送信してみましょう。
          </p>
        ) : null}

        <ul className="grid gap-3" data-testid="dm-message-list">
          {conversation.messages.map((message) => (
            <DirectMessageRow key={message.id} activeUserId={activeUserId} message={message} />
          ))}
        </ul>
        <div ref={messagesEndRef} className="h-px w-full" />
      </div>
    );
  },
);

const DirectMessageComposer = ({
  conversationId,
  isPeerTyping,
  isSubmitting,
  onSubmit,
  onTyping,
  peerName,
  stickyBarRef,
  textAreaId,
}: ComposerProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [text, setText] = useState("");
  const textAreaRows = Math.min((text || "").split("\n").length, 5);
  const isInvalid = text.trim().length === 0;

  useEffect(() => {
    setText("");
  }, [conversationId]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
      onTyping();
    },
    [onTyping],
  );

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const submittedText = text.trim();
      if (submittedText.length === 0) {
        return;
      }

      const previousText = text;
      setText("");
      void onSubmit({ body: submittedText }).catch(() => {
        setText((current) => (current.length === 0 ? previousText : current));
      });
    },
    [onSubmit, text],
  );

  return (
    <div ref={stickyBarRef} className="sticky bottom-12 z-10 lg:bottom-0">
      {isPeerTyping ? (
        <p className="bg-cax-surface-raised/75 text-cax-brand absolute inset-x-0 top-0 -translate-y-full px-4 py-1 text-xs">
          <span className="font-bold">{peerName}</span>さんが入力中…
        </p>
      ) : null}

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
  );
};

export const DirectMessagePage = ({
  conversationError,
  conversation,
  activeUser,
  isPeerTyping,
  isLoadingOlderMessages,
  isSubmitting,
  onLoadOlderMessages,
  onTyping,
  onSubmit,
}: Props) => {
  const messageListContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stickyBarRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const textAreaId = useId();

  const peer =
    conversation.initiator.id !== activeUser.id ? conversation.initiator : conversation.member;

  const lastMessage = conversation.messages[conversation.messages.length - 1] ?? null;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const handleLoadOlderMessages = useCallback(async () => {
    const container = messageListContainerRef.current;
    if (container == null || isLoadingOlderMessages) {
      return;
    }

    const previousScrollHeight = container.scrollHeight;
    const previousScrollTop = container.scrollTop;

    await onLoadOlderMessages();

    requestAnimationFrame(() => {
      const nextContainer = messageListContainerRef.current;
      if (nextContainer == null) {
        return;
      }

      nextContainer.scrollTop =
        previousScrollTop + (nextContainer.scrollHeight - previousScrollHeight);
    });
  }, [isLoadingOlderMessages, onLoadOlderMessages]);

  useLayoutEffect(() => {
    lastMessageIdRef.current = null;
    shouldAutoScrollRef.current = true;
  }, [conversation.id]);

  useEffect(() => {
    const endEl = messagesEndRef.current;
    const stickyBarEl = stickyBarRef.current;

    if (!endEl || !stickyBarEl) {
      return;
    }

    let observer: IntersectionObserver | null = null;
    let lastHeight = -1;

    const observe = () => {
      const height = stickyBarEl.offsetHeight;
      if (height === lastHeight) return;
      lastHeight = height;
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          shouldAutoScrollRef.current = entries[0]?.isIntersecting ?? false;
        },
        {
          threshold: 1,
          rootMargin: `0px 0px -${height}px 0px`,
        },
      );
      observer.observe(endEl);
    };

    observe();

    const resizeObserver = new ResizeObserver(() => {
      observe();
      if (shouldAutoScrollRef.current) {
        scrollToBottom();
      }
    });
    resizeObserver.observe(stickyBarEl);

    return () => {
      observer?.disconnect();
      resizeObserver.disconnect();
    };
  }, [scrollToBottom]);

  useLayoutEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [isPeerTyping, scrollToBottom]);

  useLayoutEffect(() => {
    const nextLastMessageId = lastMessage?.id ?? null;
    const previousLastMessageId = lastMessageIdRef.current;

    if (previousLastMessageId === null) {
      scrollToBottom();
    } else if (nextLastMessageId !== previousLastMessageId) {
      const sentByActiveUser = lastMessage?.sender.id === activeUser.id;
      if (sentByActiveUser || shouldAutoScrollRef.current) {
        scrollToBottom(sentByActiveUser ? "smooth" : "auto");
      }
    }

    lastMessageIdRef.current = nextLastMessageId;
  }, [activeUser.id, lastMessage, scrollToBottom]);

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
          alt={peer.profileImage?.alt ?? ""}
          className="h-12 w-12 rounded-full object-cover"
          decoding="async"
          src={getSafeProfileImagePath(peer.profileImage)}
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

      <DirectMessageMessageList
        activeUserId={activeUser.id}
        conversation={conversation}
        isLoadingOlderMessages={isLoadingOlderMessages}
        messageListContainerRef={messageListContainerRef}
        messagesEndRef={messagesEndRef}
        onLoadOlderMessages={handleLoadOlderMessages}
      />

      <DirectMessageComposer
        conversationId={conversation.id}
        isPeerTyping={isPeerTyping}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        onTyping={onTyping}
        peerName={peer.name}
        stickyBarRef={stickyBarRef}
        textAreaId={textAreaId}
      />
    </section>
  );
};
