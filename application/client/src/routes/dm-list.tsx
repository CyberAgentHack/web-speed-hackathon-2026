import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";
import { getLoaderContext } from "@web-speed-hackathon-2026/client/src/utils/server_fetch";
import { useId } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useOutletContext } from "react-router";
import type { LayoutContext } from "./layout";

export async function loader({ context }: LoaderFunctionArgs) {
	const ctx = getLoaderContext(context);
	const conversations = await ctx.getDmConversations() as Models.DirectMessageConversation[] | null;
	return { conversations };
}

export default function DmList() {
	const { activeUser, authModalId } = useOutletContext<LayoutContext>();
	const { conversations: initialConversations } = useLoaderData<typeof loader>();
	const newDmModalId = useId();

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
			<title>ダイレクトメッセージ - CaX</title>
			<DirectMessageListPage
				activeUser={activeUser}
				newDmModalId={newDmModalId}
				initialConversations={initialConversations}
			/>
			<NewDirectMessageModalContainer id={newDmModalId} />
		</>
	);
}
