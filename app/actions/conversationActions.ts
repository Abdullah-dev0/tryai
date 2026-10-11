"use server";

import { getSession } from "@/lib/data/auth";
import { getConversationForUser, getUserConversations, searchUserMessages } from "@/lib/data/conversation";
import { loadChat } from "@/lib/data/chat";
import { conversations, db } from "@/lib/db";
import { Conversation, ConversationSearchResult } from "@/lib/types";
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
			title: conv.title,
			isPublic: conv.isPublic,
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

async function updateConversation(id: string, values: Partial<typeof conversations.$inferInsert>) {
	const session = await getSession();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}
	try {
		await db
			.update(conversations)
			.set(values)
			.where(and(eq(conversations.id, id), eq(conversations.userId, session.user.id)));
	} catch (error) {
		console.error("Failed to update conversation:", error);
		throw new Error("Failed to update conversation");
	}
	revalidatePath("/");
}

export async function renameConversation(id: string, title: string) {
	const trimmed = title.trim().slice(0, 100);
	if (!trimmed) {
		throw new Error("Title cannot be empty");
	}
	await updateConversation(id, { title: trimmed });
}

export async function setConversationPinned(id: string, pinned: boolean) {
	await updateConversation(id, { pinned });
}

export async function setConversationPublic(id: string, isPublic: boolean) {
	await updateConversation(id, { isPublic });
}

export async function searchConversations(query: string): Promise<ConversationSearchResult[]> {
	const session = await getSession();
	if (!session?.user) return [];
	try {
		return await searchUserMessages(session.user.id, query.slice(0, 100));
	} catch (error) {
		console.error("Failed to search conversations:", error);
		return [];
	}
}
