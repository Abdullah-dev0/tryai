"use server";

import { redirect } from "next/navigation";
import { turso, generateId } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createChatAction(firstMessageContent: string) {
	const id = generateId();
	const now = Date.now();
	const messageId = generateId();

	// 1. Create the Chat Session in DB
	await turso.execute({
		sql: "INSERT INTO conversations (id, created_at, updated_at) VALUES (?, ?, ?)",
		args: [id, now, now],
	});

	// 2. Save the first message
	await turso.execute({
		sql: "INSERT INTO messages (id, role, content, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
		args: [messageId, "user", firstMessageContent, now, id],
	});

	// Revalidate paths
	revalidatePath("/");

	// 3. Redirect to the dynamic route
	redirect(`/chat/${id}`);
}
