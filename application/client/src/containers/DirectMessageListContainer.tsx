import { useId } from "react";

import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";
import { useDocumentTitle } from "@web-speed-hackathon-2026/client/src/hooks/use_document_title";

interface Props {
    activeUser: Models.User | null;
    authModalId: string;
}

export const DirectMessageListContainer = ({
    activeUser,
    authModalId,
}: Props) => {
    const newDmModalId = useId();
    useDocumentTitle("ダイレクトメッセージ - CaX");

    if (activeUser === null) {
        return (
            <DirectMessageGate
                headline="DMを利用するにはサインインが必要です"
                authModalId={authModalId}
            />
        );
    }

    return (
        <>
            <DirectMessageListPage
                activeUser={activeUser}
                newDmModalId={newDmModalId}
            />
            <NewDirectMessageModalContainer id={newDmModalId} />
        </>
    );
};
