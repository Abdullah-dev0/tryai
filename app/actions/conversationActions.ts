"use server";

import { getSession } from "@/lib/data/auth";
import { getUserConversations } from "@/lib/data/conversation";
import { conversations, db, messages } from "@/lib/db";
import { Conversation } from "@/lib/types";
import { generateId } from "ai";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getConversations = cache(async (): Promise<Conversation[]> => {
	const session = await getSession();

	if (!session?.user) {
		return [];
	}
	try {
		const conversations = await getUserConversations(session.user.id);
		return conversations;
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
	const session = await getSession();

	if (!session?.user) {
		return null;
	}
	try {
		const id = generateId();
		const now = Date.now();

		await db.insert(conversations).values({
			id,
			userId: session.user.id,
			createdAt: now,
			updatedAt: now,
		});

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
		await db.delete(conversations).where(eq(conversations.id, id));
	} catch (error) {
		console.error("Failed to delete conversation:", error);
		throw new Error("Failed to delete conversation");
	}
	revalidatePath("/");
}
