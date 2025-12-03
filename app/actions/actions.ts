"use server";

import { turso, generateId } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Row } from "@libsql/client";

export async function getConversations() {
	try {
		const result = await turso.execute(`
			SELECT 
				c.id,
				c.created_at,
				c.updated_at,
				(SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
			FROM conversations c
			ORDER BY c.updated_at DESC
		`);

		return result.rows.map((row) => ({
			id: row.id as string,
			createdAt: new Date(row.created_at as number),
			updatedAt: new Date(row.updated_at as number),
			lastMessage: row.last_message as string | null,
		}));
	} catch (error) {
		console.error("Failed to fetch conversations:", error);
		return [];
	}
}

export const getConversation = async (id: string) => {
	try {
		const convResult = await turso.execute({
			sql: "SELECT * FROM conversations WHERE id = ?",
			args: [id],
		});

		if (convResult.rows.length === 0) return null;

		const conv = convResult.rows[0];
		const messagesResult = await turso.execute({
			sql: "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
			args: [id],
		});

		return {
			id: conv.id as string,
			createdAt: new Date(conv.created_at as number),
			updatedAt: new Date(conv.updated_at as number),
			messages: messagesResult.rows.map((m: Row) => ({
				id: m.id as string,
				role: m.role as string,
				content: m.content as string,
				createdAt: new Date(m.created_at as number),
				conversationId: m.conversation_id as string,
			})),
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

		await turso.execute({
			sql: "INSERT INTO conversations (id, created_at, updated_at) VALUES (?, ?, ?)",
			args: [id, now, now],
		});

		// Revalidate conversations list
		revalidatePath("/");
		revalidatePath("/chat");

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
		await turso.execute({
			sql: "DELETE FROM messages WHERE conversation_id = ?",
			args: [id],
		});

		await turso.execute({
			sql: "DELETE FROM conversations WHERE id = ?",
			args: [id],
		});

		// Revalidate paths
		revalidatePath("/");
		revalidatePath("/chat");
		revalidatePath(`/chat/${id}`);
	} catch (error) {
		console.error("Failed to delete conversation:", error);
	}
}
