import { turso } from "@/lib/db";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { consumeStream, convertToModelMessages, generateId, pruneMessages, streamText, type UIMessage } from "ai";

export const maxDuration = 30;

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

// Helper to load chat messages from database (following docs pattern)
async function loadChat(id: string): Promise<UIMessage[]> {
	const result = await turso.execute({
		sql: "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
		args: [id],
	});

	return result.rows.map((row) => ({
		id: row.id as string,
		role: row.role as "user" | "assistant",
		parts: JSON.parse(row.parts as string),
	}));
}

// Helper to save all chat messages to database (following docs pattern)
async function saveChat({ chatId, messages }: { chatId: string; messages: UIMessage[] }): Promise<void> {
	// Insert or update messages (handles duplicates)
	for (const msg of messages) {
		await turso.execute({
			sql: "INSERT OR REPLACE INTO messages (id, role, parts, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
			args: [msg.id, msg.role, JSON.stringify(msg.parts), Date.now(), chatId],
		});
	}

	// Update conversation timestamp
	await turso.execute({
		sql: "UPDATE conversations SET updated_at = ? WHERE id = ?",
		args: [Date.now(), chatId],
	});
}

export async function POST(req: Request) {
	const { message, body } = (await req.json()) as {
		message: UIMessage;
		body?: { model?: string; conversationId?: string };
	};
	const model = body?.model;
	const conversationId = body?.conversationId;

	const targetModel = model && model.trim().length > 0 ? model : "arcee-ai/trinity-mini:free";

	if (!message) {
		return new Response("No message provided", { status: 400 });
	}

	if (!conversationId) {
		return new Response("No conversation ID provided", { status: 400 });
	}

	// Load previous messages from database
	const previousMessages = await loadChat(conversationId);

	const modelMessages = convertToModelMessages([...previousMessages.slice(0, -3), message]);

	const prunedMessages = pruneMessages({
		messages: modelMessages,
		reasoning: "all",
		toolCalls: "all",
		emptyMessages: "remove",
	});

	const result = streamText({
		model: openrouter(targetModel),
		messages: prunedMessages,
		system:
			"You are a helpful AI assistant. Answer the user's questions to the best of your ability always being concise and reply on markdown format. If you do not know the answer, just say that you do not know. Do not try to make up an answer.",
	});

	// Track if an error occurs during streaming
	let hasError = false;

	return result.toUIMessageStreamResponse({
		originalMessages: [...previousMessages.slice(0, -3), message],
		generateMessageId: generateId,
		consumeSseStream: consumeStream,
		onError(error) {
			console.error("Streaming error:", error);
			hasError = true;
			return error instanceof Error ? error.message : String(error);
		},
		async onFinish({ messages }) {
			if (hasError) return;
			await saveChat({ chatId: conversationId, messages });
		},
	});
}
