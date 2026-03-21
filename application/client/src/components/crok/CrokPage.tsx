import { useRef } from "react";

import { ChatInput } from "@web-speed-hackathon-2026/client/src/components/crok/ChatInput";
import { ChatMessage } from "@web-speed-hackathon-2026/client/src/components/crok/ChatMessage";
import { WelcomeScreen } from "@web-speed-hackathon-2026/client/src/components/crok/WelcomeScreen";
import { useHasContentBelow } from "@web-speed-hackathon-2026/client/src/hooks/use_has_content_below";

interface Props {
  messages: Models.ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
}

export const CrokPage = ({ messages, isStreaming, onSendMessage }: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stickyBarRef = useRef<HTMLDivElement>(null);
  const showScrollButton = useHasContentBelow(messagesEndRef, stickyBarRef);

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-cax-surface flex min-h-[calc(100vh-(--spacing(12)))] flex-col lg:min-h-screen">
      <div className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8">
          {messages.length === 0 && <WelcomeScreen />}

          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div ref={stickyBarRef} className="sticky bottom-12 lg:bottom-0">
        {showScrollButton && (
          <button
            className="border-cax-border bg-cax-surface hover:bg-cax-surface-subtle absolute -top-10 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border shadow-md transition-colors"
            onClick={handleScrollToBottom}
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 448 512"
              fill="currentColor"
            >
              <path d="M413.1 222.5l22.2 22.2c9.4 9.4 9.4 24.6 0 33.9L241 473c-9.4 9.4-24.6 9.4-33.9 0L12.7 278.6c-9.4-9.4-9.4-24.6 0-33.9l22.2-22.2c9.5-9.5 25-9.3 34.3.4L184 343.4V56c0-13.3 10.7-24 24-24h32c13.3 0 24 10.7 24 24v287.4l114.8-120.5c9.3-9.8 24.8-10 34.3-.4z"></path>
            </svg>
          </button>
        )}
        <ChatInput isStreaming={isStreaming} onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};
