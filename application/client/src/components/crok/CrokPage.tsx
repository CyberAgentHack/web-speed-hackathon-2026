import { Suspense, lazy, useRef } from "react";

import { ChatInput } from "@web-speed-hackathon-2026/client/src/components/crok/ChatInput";
const ChatMessage = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/components/crok/ChatMessage").then((m) => ({
    default: m.ChatMessage,
  })),
);
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { WelcomeScreen } from "@web-speed-hackathon-2026/client/src/components/crok/WelcomeScreen";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
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

          <Suspense fallback={
            <div className="mb-6 flex gap-4">
              <div className="h-8 w-8 shrink-0"><CrokLogo className="h-full w-full" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
                <div className="markdown text-cax-text max-w-none"><TypingIndicator /></div>
              </div>
            </div>
          }>
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
