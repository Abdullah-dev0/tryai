"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { ChatInterface } from "./chatInterface";
import type { UIMessage } from "ai";

interface Message {
	id: unknown;
	role: unknown;
	content: unknown;
	createdAt: Date;
	conversationId: unknown;
}

interface Conversation {
	id: unknown;
	createdAt: Date;
	updatedAt: Date;
	messages: Message[];
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

	// Transform messages to UIMessage format
	const initialMessages: UIMessage[] = conversation.messages.map((m) => ({
		id: m.id as string,
		role: m.role as "user" | "assistant",
		parts: [{ type: "text" as const, text: m.content as string }],
		createdAt: m.createdAt,
	}));

	return <ChatInterface id={id} initialMessages={initialMessages} />;
}
