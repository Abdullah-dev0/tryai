import { notFound } from "next/navigation";
import { getConversation } from "@/app/actions/conversationActions";
import { ChatInterface } from "./chatInterface";

interface ChatContentProps {
	id: string;
}

export async function ChatContent({ id }: ChatContentProps) {
	const conversation = await getConversation(id);

	if (!conversation) {
		notFound();
	}

	return <ChatInterface id={id} initialMessages={conversation.messages} totalTokens={conversation.totalTokens} />;
}
