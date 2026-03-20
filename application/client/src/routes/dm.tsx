import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessagePage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessagePage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import type { DirectMessageFormData } from "@web-speed-hackathon-2026/client/src/direct_message/types";
import { useWs } from "@web-speed-hackathon-2026/client/src/hooks/use_ws";
import {
	fetchJSON,
	sendJSON,
} from "@web-speed-hackathon-2026/client/src/utils/fetchers";
import { getLoaderContext } from "@web-speed-hackathon-2026/client/src/utils/server_fetch";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useOutletContext, useParams } from "react-router";
import type { LayoutContext } from "./layout";

interface DmUpdateEvent {
	type: "dm:conversation:message";
	payload: Models.DirectMessage;
}
interface DmTypingEvent {
	type: "dm:conversation:typing";
	payload: Record<string, never>;
}

const TYPING_INDICATOR_DURATION_MS = 10 * 1000;

export async function loader({ context, params }: LoaderFunctionArgs) {
	const ctx = getLoaderContext(context);
	const { conversationId } = params;
	const conversation = await ctx.getDmConversation(conversationId!) as Models.DirectMessageConversation | null;
	return { conversation };
}

export default function Dm() {
	const { activeUser, authModalId } = useOutletContext<LayoutContext>();
	const { conversationId = "" } = useParams<{ conversationId: string }>();
	const { conversation: initialConversation } = useLoaderData<typeof loader>();

	const [conversation, setConversation] =
		useState<Models.DirectMessageConversation | null>(initialConversation);
	const [conversationError, setConversationError] = useState<Error | null>(
		null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [isPeerTyping, setIsPeerTyping] = useState(false);
	const peerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const loadConversation = useCallback(async () => {
		if (activeUser == null) {
			return;
		}

		try {
			const data = await fetchJSON<Models.DirectMessageConversation>(
				`/api/v1/dm/${conversationId}`,
			);
			setConversation(data);
			setConversationError(null);
		} catch (error) {
			setConversation(null);
			setConversationError(error as Error);
		}
	}, [activeUser, conversationId]);

	const sendRead = useCallback(async () => {
		await sendJSON(`/api/v1/dm/${conversationId}/read`, {});
	}, [conversationId]);

	useEffect(() => {
		if (initialConversation != null) return;
		void loadConversation();
		void sendRead();
	}, [loadConversation, sendRead, initialConversation]);

	useEffect(() => {
		if (initialConversation != null && activeUser != null) {
			void sendRead();
		}
	}, [initialConversation, activeUser, sendRead]);

	const handleSubmit = useCallback(
		async (params: DirectMessageFormData) => {
			setIsSubmitting(true);
			try {
				await sendJSON(`/api/v1/dm/${conversationId}/messages`, {
					body: params.body,
				});
				loadConversation();
			} finally {
				setIsSubmitting(false);
			}
		},
		[conversationId, loadConversation],
	);

	const handleTyping = useCallback(async () => {
		void sendJSON(`/api/v1/dm/${conversationId}/typing`, {});
	}, [conversationId]);

	useWs(
		`/api/v1/dm/${conversationId}`,
		(event: DmUpdateEvent | DmTypingEvent) => {
			if (event.type === "dm:conversation:message") {
				void loadConversation().then(() => {
					if (event.payload.sender.id !== activeUser?.id) {
						setIsPeerTyping(false);
						if (peerTypingTimeoutRef.current !== null) {
							clearTimeout(peerTypingTimeoutRef.current);
						}
						peerTypingTimeoutRef.current = null;
					}
				});
				void sendRead();
			} else if (event.type === "dm:conversation:typing") {
				setIsPeerTyping(true);
				if (peerTypingTimeoutRef.current !== null) {
					clearTimeout(peerTypingTimeoutRef.current);
				}
				peerTypingTimeoutRef.current = setTimeout(() => {
					setIsPeerTyping(false);
				}, TYPING_INDICATOR_DURATION_MS);
			}
		},
	);

	if (activeUser === null) {
		return (
			<DirectMessageGate
				headline="DMを利用するにはサインインしてください"
				authModalId={authModalId}
			/>
		);
	}

	if (conversation == null) {
		if (conversationError != null) {
			return <NotFoundContainer />;
		}
		return null;
	}

	const peer =
		conversation.initiator.id !== activeUser?.id
			? conversation.initiator
			: conversation.member;

	return (
		<>
			<title>{`${peer.name} さんとのダイレクトメッセージ - CaX`}</title>
			<DirectMessagePage
				conversationError={conversationError}
				conversation={conversation}
				activeUser={activeUser}
				onTyping={handleTyping}
				isPeerTyping={isPeerTyping}
				isSubmitting={isSubmitting}
				onSubmit={handleSubmit}
			/>
		</>
	);
}
