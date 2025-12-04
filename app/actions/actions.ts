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
				(SELECT parts FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_parts
			FROM conversations c
			ORDER BY c.updated_at DESC
		`);

		return result.rows.map((row) => {
			// Extract text from parts JSON for preview
			let lastMessage: string | null = null;
			if (row.last_parts) {
				try {
					const parts = JSON.parse(row.last_parts as string);
					lastMessage = parts
						.filter((p: { type: string }) => p.type === "text")
						.map((p: { text: string }) => p.text)
						.join("");
				} catch {
					lastMessage = null;
				}
			}
			return {
				id: row.id as string,
				createdAt: new Date(row.created_at as number),
				updatedAt: new Date(row.updated_at as number),
				lastMessage,
			};
		});
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

		const messagesResult = await turso.execute({
			sql: "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
			args: [id],
		});

		// Return UIMessage[] directly - parts are stored as JSON
		return {
			messages: messagesResult.rows.map((m: Row) => ({
				id: m.id as string,
				role: m.role as "user" | "assistant",
				parts: JSON.parse(m.parts as string),
				createdAt: new Date(m.created_at as number),
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
