import { Suspense } from "react";
import { ChatContent } from "@/components/chat/chatContent";
import { ChatLoading } from "@/components/loading/chatLoading";
import { ChatError } from "@/components/errors/chatError";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
	return (
		<ErrorBoundary fallback={<ChatError />}>
			<Suspense fallback={<ChatLoading />}>
				<ChatPageContent params={params} />
			</Suspense>
		</ErrorBoundary>
	);
}

async function ChatPageContent({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <ChatContent id={id} />;
}
