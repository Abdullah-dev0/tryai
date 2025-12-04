"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { ChatInterface } from "./chatInterface";
import type { UIMessage } from "ai";

interface Conversation {
	messages: UIMessage[];
}

interface ChatContentProps {
	id: string;
	conversationPromise: Promise<Conversation | null>;
}

export function ChatContent({ id, conversationPromise }: ChatContentProps) {
	const conversation = use(conversationPromise);

	// Handle not found case
	if (!conversation) {
		notFound();
	}

	// Messages are already in UIMessage format from the database
	return <ChatInterface id={id} initialMessages={conversation.messages} />;
}
