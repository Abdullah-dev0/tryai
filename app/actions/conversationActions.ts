"use server";

import { getSession } from "@/lib/data/auth";
import { getConversationForUser, getUserConversations } from "@/lib/data/conversation";
import { loadChat } from "@/lib/data/chat";
import { conversations, db } from "@/lib/db";
import { Conversation } from "@/lib/types";
import { generateId } from "ai";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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
	const session = await getSession();
	if (!session?.user) return null;
	try {
		const conv = await getConversationForUser(session.user.id, id);
		if (!conv) return null;
		const messages = await loadChat(id);
		return {
			messages,
			totalTokens: conv.totalTokens ?? 0,
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
	const session = await getSession();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}
	try {
		await db
			.delete(conversations)
			.where(and(eq(conversations.id, id), eq(conversations.userId, session.user.id)));
	} catch (error) {
		console.error("Failed to delete conversation:", error);
		throw new Error("Failed to delete conversation");
	}
	revalidatePath("/");
}
