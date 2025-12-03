"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { ChatInterface } from "./chatInterface";
import type { UIMessage } from "ai";

interface Message {
	id: unknown;
	role: unknown;
	content: unknown;
	reasoning?: string | null;
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
	const initialMessages: UIMessage[] = conversation.messages.map((m) => {
		const parts: UIMessage["parts"] = [];

		// Add reasoning part first if it exists (for assistant messages)
		if (m.role === "assistant" && m.reasoning) {
			parts.push({ type: "reasoning" as const, text: m.reasoning });
		}

		// Add text content
		parts.push({ type: "text" as const, text: m.content as string });

		return {
			id: m.id as string,
			role: m.role as "user" | "assistant",
			parts,
			createdAt: m.createdAt,
		};
	});

	return <ChatInterface id={id} initialMessages={initialMessages} />;
}
