import classNames from "classnames";
const jaTimeFormat = new Intl.DateTimeFormat("ja", { hour: "2-digit", minute: "2-digit", hour12: false });
import {
  ChangeEvent,
  useCallback,
  useId,
  useRef,
  useState,
  KeyboardEvent,
  FormEvent,
  useEffect,
  type CSSProperties,
} from "react";
import { List, useListRef } from "react-window";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
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

// メッセージの高さを推定（テキスト長に基づく）
function estimateMessageHeight(body: string): number {
  const charsPerLine = 30;
  const lineCount = Math.max(1, Math.ceil(body.length / charsPerLine)) + (body.split("\n").length - 1);
  const textHeight = lineCount * 22;
  return textHeight + 48; // padding + time row
}

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
  const textAreaId = useId();
  const listRef = useListRef(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(500);

  const peer =
    conversation.initiator.id !== activeUser.id ? conversation.initiator : conversation.member;

  const messages = conversation.messages;

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
      void onSubmit({ body: text.trim() }).then(() => {
        setText("");
      });
    },
    [onSubmit, text],
  );

  // リスト高さを動的に計算
  useEffect(() => {
    const updateHeight = () => {
      if (listContainerRef.current) {
        const rect = listContainerRef.current.getBoundingClientRect();
        setListHeight(rect.height);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // メッセージが変わったら最下部にスクロール
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToRow({ index: messages.length - 1, align: "end" });
    }
  }, [messages.length, listRef]);

  // 各メッセージの高さを推定
  const getRowHeight = useCallback(
    (index: number) => estimateMessageHeight(messages[index]!.body),
    [messages],
  );

  const MessageRow = useCallback(({ index, style }: { index: number; style: CSSProperties; ariaAttributes: any }) => {
    const message = messages[index]!;
    const isActiveUserSend = message.sender.id === activeUser.id;

    return (
      <li style={style} className="px-4 list-none">
        <div
          className={classNames(
            "flex flex-col w-full py-1.5",
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
              {jaTimeFormat.format(new Date(message.createdAt))}
            </time>
            {isActiveUserSend && message.isRead && (
              <span className="text-cax-text-muted">既読</span>
            )}
          </div>
        </div>
      </li>
    );
  }, [messages, activeUser.id]);

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
          height={48}
          src={getProfileImagePath(peer.profileImage.id)}
          width={48}
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

      <div ref={listContainerRef} className="bg-cax-surface-subtle flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <p className="text-cax-text-muted px-4 pt-4 text-center text-sm">
            まだメッセージはありません。最初のメッセージを送信してみましょう。
          </p>
        ) : (
          <List
            listRef={listRef}
            rowCount={messages.length}
            rowHeight={getRowHeight}
            rowComponent={MessageRow}
            rowProps={{}}
            style={{ height: listHeight }}
            overscanCount={5}
          />
        )}
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
