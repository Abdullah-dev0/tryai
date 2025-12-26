"use server";

import { db, conversations, messages } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { generateId } from "ai";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export const getConversations = cache(async () => {
	try {
		// Get conversations with their last message
		const result = await db
			.select({
				id: conversations.id,
				createdAt: conversations.createdAt,
				updatedAt: conversations.updatedAt,
				lastParts: sql<string | null>`(
					SELECT ${messages.parts} 
					FROM ${messages} 
					WHERE ${messages.conversationId} = ${conversations.id} 
					ORDER BY ${messages.createdAt} DESC 
					LIMIT 1
				)`,
			})
			.from(conversations)
			.orderBy(desc(conversations.updatedAt));

		return result.map((row) => {
			// Extract text from parts JSON for preview
			let lastMessage: string | null = null;
			if (row.lastParts) {
				try {
					const parts = JSON.parse(row.lastParts);
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
	} catch (error) {
		console.error("Failed to fetch conversations:", error);
		return [];
	}
});

export const getConversation = async (id: string) => {
	try {
		const convResult = await db
			.select({
				id: conversations.id,
				createdAt: conversations.createdAt,
				updatedAt: conversations.updatedAt,
				totalTokens: conversations.totalTokens,
			})
			.from(conversations)
			.where(eq(conversations.id, id));

		if (convResult.length === 0) return null;

		const messagesResult = await db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, id))
			.orderBy(messages.createdAt);

		// Return UIMessage[] directly - parts are stored as JSON
		return {
			messages: messagesResult.map((m) => ({
				id: m.id,
				role: m.role as "user" | "assistant",
				parts: JSON.parse(m.parts),
				createdAt: new Date(m.createdAt),
			})),
			totalTokens: convResult[0].totalTokens ?? 0,
		};
	} catch (error) {
		console.error("Failed to fetch conversation:", error);
		return null;
	}
};

export async function createConversation() {
	try {
		const id = generateId();
		const now = Date.now();

		await db.insert(conversations).values({
			id,
			createdAt: now,
			updatedAt: now,
		});

		// Revalidate conversations list
		revalidatePath("/");

		return {
			id,
			createdAt: new Date(now),
			updatedAt: new Date(now),
		};
	} catch (error) {
		console.error("Failed to create conversation:", error);
		return null;
	}
}

export async function deleteConversation(id: string) {
	try {
		// Delete messages first (foreign key constraint)
		await db.delete(messages).where(eq(messages.conversationId, id));

		await db.delete(conversations).where(eq(conversations.id, id));

		// Revalidate paths
		revalidatePath("/");
	} catch (error) {
		console.error("Failed to delete conversation:", error);
	}
}
