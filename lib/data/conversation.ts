import { and, desc, eq, sql } from "drizzle-orm";
import { conversations, db, messages } from "../db";

export async function getConversationForUser(userId: string, conversationId: string) {
	const result = await db
		.select({
			id: conversations.id,
			userId: conversations.userId,
			createdAt: conversations.createdAt,
			updatedAt: conversations.updatedAt,
			totalTokens: conversations.totalTokens,
		})
		.from(conversations)
		.where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
		.limit(1);
	return result[0] ?? null;
}

export const getUserConversations = async (userId: string) => {
	// Subquery to get the latest message for each conversation
	const latestMessages = db
		.select({
			conversationId: messages.conversationId,
			parts: messages.parts,
			maxCreatedAt: sql<number>`MAX(${messages.createdAt})`.as("max_created_at"),
		})
		.from(messages)
		.groupBy(messages.conversationId)
		.as("latest_messages");

	const result = await db
		.select({
			id: conversations.id,
			createdAt: conversations.createdAt,
			updatedAt: conversations.updatedAt,
			parts: latestMessages.parts,
		})
		.from(conversations)
		.leftJoin(latestMessages, eq(conversations.id, latestMessages.conversationId))
		.where(eq(conversations.userId, userId))
		.orderBy(desc(conversations.updatedAt));

	return result.map((row) => {
		// Extract text from parts JSON for preview
		let lastMessage: string | null = null;
		if (row.parts) {
			try {
				const parts = JSON.parse(row.parts);
				lastMessage = parts
					.filter((p: { type: string }) => p.type === "text")
					.map((p: { text: string }) => p.text)
					.join("");
			} catch {
				lastMessage = null;
			}
		}

		return {
			id: row.id,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt),
			lastMessage,
		};
	});
};
