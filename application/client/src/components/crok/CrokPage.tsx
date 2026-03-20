import { Suspense, lazy, useRef } from "react";

import { ChatInput } from "@web-speed-hackathon-2026/client/src/components/crok/ChatInput";
import { WelcomeScreen } from "@web-speed-hackathon-2026/client/src/components/crok/WelcomeScreen";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { useHasContentBelow } from "@web-speed-hackathon-2026/client/src/hooks/use_has_content_below";

const ChatMessage = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/crok/ChatMessage").then((module) => ({
    default: module.ChatMessage,
  })),
);

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

          <Suspense fallback={null}>
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
          </Suspense>
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
            <FontAwesomeIcon iconType="arrow-down" styleType="solid" />
          </button>
        )}
        <ChatInput isStreaming={isStreaming} onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};
