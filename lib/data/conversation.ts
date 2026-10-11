import { and, desc, eq, sql } from "drizzle-orm";
import { conversations, db, messages } from "../db";
import { loadChat } from "./chat";
import type { ConversationSearchResult } from "../types";

function textFromParts(raw: string | null): string | null {
	if (!raw) return null;
	try {
		const parts = JSON.parse(raw);
		return parts
			.filter((p: { type: string }) => p.type === "text")
			.map((p: { text: string }) => p.text)
			.join("");
	} catch {
		return null;
	}
}

export async function getConversationForUser(userId: string, conversationId: string) {
	const result = await db
		.select({
			id: conversations.id,
			userId: conversations.userId,
			title: conversations.title,
			pinned: conversations.pinned,
			isPublic: conversations.isPublic,
			createdAt: conversations.createdAt,
			updatedAt: conversations.updatedAt,
			totalTokens: conversations.totalTokens,
		})
		.from(conversations)
		.where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
		.limit(1);
	return result[0] ?? null;
}

export async function getPublicConversation(conversationId: string) {
	const result = await db
		.select({ id: conversations.id, title: conversations.title })
		.from(conversations)
		.where(and(eq(conversations.id, conversationId), eq(conversations.isPublic, true)))
		.limit(1);
	const conversation = result[0];
	if (!conversation) return null;
	return { title: conversation.title, messages: await loadChat(conversation.id) };
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
			title: conversations.title,
			pinned: conversations.pinned,
			isPublic: conversations.isPublic,
			createdAt: conversations.createdAt,
			updatedAt: conversations.updatedAt,
			parts: latestMessages.parts,
		})
		.from(conversations)
		.leftJoin(latestMessages, eq(conversations.id, latestMessages.conversationId))
		.where(eq(conversations.userId, userId))
		.orderBy(desc(conversations.updatedAt));

	return result.map((row) => ({
		id: row.id,
		title: row.title,
		pinned: row.pinned,
		isPublic: row.isPublic,
		createdAt: new Date(row.createdAt),
		updatedAt: new Date(row.updatedAt),
		lastMessage: textFromParts(row.parts),
	}));
};

export async function searchUserMessages(userId: string, query: string): Promise<ConversationSearchResult[]> {
	const needle = query.trim().toLowerCase();
	if (needle.length < 2) return [];
	const pattern = `%${needle.replace(/[\\%_]/g, "\\$&")}%`;

	const rows = await db
		.select({ conversationId: messages.conversationId, parts: messages.parts })
		.from(messages)
		.innerJoin(conversations, eq(messages.conversationId, conversations.id))
		.where(and(eq(conversations.userId, userId), sql`${messages.parts} like ${pattern} escape '\\'`))
		.orderBy(desc(messages.createdAt))
		.limit(200);

	const results = new Map<string, ConversationSearchResult>();
	for (const row of rows) {
		if (results.has(row.conversationId)) continue;
		const text = textFromParts(row.parts)?.replace(/\s+/g, " ");
		const index = text?.toLowerCase().indexOf(needle) ?? -1;
		if (!text || index === -1) continue;
		const start = Math.max(0, index - 30);
		const snippet = (start > 0 ? "…" : "") + text.slice(start, index + needle.length + 50).trim();
		results.set(row.conversationId, { conversationId: row.conversationId, snippet });
		if (results.size >= 20) break;
	}
	return [...results.values()];
}
