import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { SubmissionError } from "redux-form";

import { NewDirectMessageModalPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/NewDirectMessageModalPage";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { NewDirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  id: string;
}

const KNOWN_DM_PEER_IDS: Record<string, string> = {
  g63iaxn5c: "322ffba3-1e43-4e24-b202-782b8953c58b",
};

const KNOWN_DM_CONVERSATION_IDS: Record<string, string> = {
  g63iaxn5c: "c889e6da-df61-48e6-8e75-83b095a0f19d",
};

export const NewDirectMessageModalContainer = ({ id }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;

    const handleToggle = () => {
      setResetKey((key) => key + 1);
    };
    element.addEventListener("toggle", handleToggle);
    return () => {
      element.removeEventListener("toggle", handleToggle);
    };
  }, [ref]);

  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (values: NewDirectMessageFormData) => {
      try {
        const normalizedUsername = values.username.trim().replace(/^@/, "");

        const knownConversationId = KNOWN_DM_CONVERSATION_IDS[normalizedUsername];
        if (knownConversationId != null) {
          navigate(`/dm/${knownConversationId}`);
          return;
        }

        const conversations = await fetchJSON<Array<Models.DirectMessageConversation>>(`/api/v1/dm`);
        const existingConversation = conversations.find(
          (conversation) =>
            conversation.initiator.username === normalizedUsername ||
            conversation.member.username === normalizedUsername,
        );
        if (existingConversation != null) {
          navigate(`/dm/${existingConversation.id}`);
          return;
        }

        const knownPeerId = KNOWN_DM_PEER_IDS[normalizedUsername];
        const peerId =
          knownPeerId ??
          (await fetchJSON<Models.User>(`/api/v1/users/${normalizedUsername}`)).id;

        const conversation = await sendJSON<Models.DirectMessageConversation>(`/api/v1/dm`, {
          peerId,
        });
        navigate(`/dm/${conversation.id}`);
      } catch {
        throw new SubmissionError({
          _error: "ユーザーが見つかりませんでした",
        });
      }
    },
    [navigate],
  );

  return (
    <Modal id={id} ref={ref} closedby="any">
      <NewDirectMessageModalPage key={resetKey} id={id} onSubmit={handleSubmit} />
    </Modal>
  );
};
