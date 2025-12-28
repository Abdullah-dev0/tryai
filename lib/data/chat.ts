import { db, messages, conversations } from "@/lib/db";
import { ChatMessage } from "@/lib/types";
import { eq, sql } from "drizzle-orm";

// Helper to load chat messages from database (following docs pattern)
export async function loadChat(id: string): Promise<ChatMessage[]> {
	const result = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);

	return result.map((row) => ({
		id: row.id,
		role: row.role as "user" | "assistant",
		parts: JSON.parse(row.parts),
	}));
}

// Helper to save all chat messages to database (following docs pattern)
export async function saveChat({ chatId, messages: chatMessages }: { chatId: string; messages: ChatMessage[] }) {
	// Only save the last 2 messages (user message + AI response)
	// Previous messages are already persisted in the database
	const userMessage = chatMessages.at(-2); // Second to last = user message
	const aiMessage = chatMessages.at(-1); // Last = AI response

	const messagesToSave = [userMessage, aiMessage].filter(Boolean) as ChatMessage[];

	const baseTime = Date.now();
	for (const msg of messagesToSave) {
		// Ensure deterministic order by adding index to baseTime
		// This guarantees that later messages always have a later timestamp
		// regardless of how fast the code executes
		const orderOffset = messagesToSave.indexOf(msg);
		const timestamp = baseTime + orderOffset;

		await db
			.insert(messages)
			.values({
				id: msg.id,
				role: msg.role as "user" | "assistant",
				parts: JSON.stringify(msg.parts),
				createdAt: timestamp,
				conversationId: chatId,
			})
			.onConflictDoUpdate({
				target: messages.id,
				set: {
					role: msg.role as "user" | "assistant",
					parts: JSON.stringify(msg.parts),
					createdAt: timestamp,
				},
			});
	}

	// Update conversation timestamp and add tokens
	const tokensToAdd = chatMessages.at(-1)?.metadata?.tokens ?? 0;
	await db
		.update(conversations)
		.set({
			updatedAt: Date.now(),
			totalTokens: sql`COALESCE(${conversations.totalTokens}, 0) + ${tokensToAdd}`,
		})
		.where(eq(conversations.id, chatId));
}
