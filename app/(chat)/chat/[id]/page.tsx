import { Suspense } from "react";
import { getConversation } from "@/app/actions/actions";
import { ChatContent } from "@/components/chat/chatContent";
import { ChatLoading } from "@/components/loading/chatLoading";
import { ChatError } from "@/components/errors/chatError";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const conversationPromise = getConversation(id);

	return (
		<ErrorBoundary fallback={<ChatError />}>
			<Suspense fallback={<ChatLoading />}>
				<ChatContent id={id} conversationPromise={conversationPromise} />
			</Suspense>
		</ErrorBoundary>
	);
}
