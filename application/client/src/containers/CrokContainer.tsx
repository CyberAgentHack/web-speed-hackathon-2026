import { useCallback, useState } from "react";
import { CrokPage } from "@web-speed-hackathon-2026/client/src/components/crok/CrokPage";
import { useSSE } from "@web-speed-hackathon-2026/client/src/hooks/use_sse";

export const CrokContainer = ({ activeUser, authModalId }: any) => {
  const [messages, setMessages] = useState<any[]>([]);

  const { content, isStreaming, start } = useSSE<any>({
    onMessage: (data: any, prev: string) => prev + (data.text ?? ""),
    onDone: (data: any) => data.done === true,
    onComplete: (final: string) => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [...prev.slice(0, -1), { role: "assistant", content: final }];
        }
        return prev;
      });
    }
  });

  const sendMessage = useCallback((input: string) => {
    if (!input.trim() || isStreaming) return;
    setMessages(prev => [
      ...prev,
      { role: "user", content: input },
      { role: "assistant", content: "" }
    ]);

    start(`/api/v1/crok?prompt=${encodeURIComponent(input)}`);
  }, [isStreaming, start]);

  if (!activeUser) return <div className="p-10 text-center">サインインしてください</div>;

  return <CrokPage isStreaming={isStreaming} messages={messages} onSendMessage={sendMessage} />;
};
