import { db, messages, conversations } from "@/lib/db";
import { ChatMessage } from "@/lib/types";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";

// Helper to load chat messages from database (following docs pattern)
export async function loadChat(id: string): Promise<ChatMessage[]> {
	const result = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);

	return result.map((row) => ({
		id: row.id,
		role: row.role as "user" | "assistant",
		parts: JSON.parse(row.parts),
		...(row.role === "assistant" && (row.model || row.tokens)
			? { metadata: { model: row.model ?? undefined, tokens: row.tokens ?? 0 } }
			: {}),
	}));
}

export async function saveUserMessage({ chatId, message }: { chatId: string; message: ChatMessage }) {
	await db
		.insert(messages)
		.values({
			id: message.id,
			role: "user",
			parts: JSON.stringify(message.parts),
			createdAt: Date.now(),
			conversationId: chatId,
		})
		.onConflictDoNothing();
}

export async function deleteMessages(chatId: string, ids: string[]) {
	if (ids.length === 0) return;
	await db.delete(messages).where(and(eq(messages.conversationId, chatId), inArray(messages.id, ids)));
}

export async function saveAssistantMessage({
	chatId,
	message,
	model,
	tokens,
}: {
	chatId: string;
	message: ChatMessage;
	model: string;
	tokens: number;
}) {
	await db
		.insert(messages)
		.values({
			id: message.id,
			role: "assistant",
			parts: JSON.stringify(message.parts),
			model,
			tokens,
			createdAt: Date.now(),
			conversationId: chatId,
		})
		.onConflictDoNothing();

	await db
		.update(conversations)
		.set({
			updatedAt: Date.now(),
			totalTokens: sql`COALESCE(${conversations.totalTokens}, 0) + ${tokens}`,
		})
		.where(eq(conversations.id, chatId));
}

export async function setTitleIfEmpty(chatId: string, title: string) {
	await db
		.update(conversations)
		.set({ title, updatedAt: Date.now() })
		.where(and(eq(conversations.id, chatId), isNull(conversations.title)));
}
