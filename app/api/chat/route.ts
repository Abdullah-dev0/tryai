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
	// Only save the last 2 messages (user message + AI response)
	// Previous messages are already persisted in the database
	const userMessage = messages.at(-2); // Second to last = user message
	const aiMessage = messages.at(-1); // Last = AI response

	const messagesToSave = [userMessage, aiMessage].filter(Boolean) as UIMessage[];

	const baseTime = Date.now();
	for (const msg of messagesToSave) {
		// Ensure deterministic order by adding index to baseTime
		// This guarantees that later messages always have a later timestamp
		// regardless of how fast the code executes
		const orderOffset = messagesToSave.indexOf(msg);
		const timestamp = baseTime + orderOffset;

		await turso.execute({
			sql: "INSERT OR REPLACE INTO messages (id, role, parts, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
			args: [msg.id, msg.role, JSON.stringify(msg.parts), timestamp, chatId],
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
			"You are a highly knowledgeable and friendly AI assistant. Your primary goal is to provide accurate and concise answers to user queries, always formatting your responses using Markdown for readability. If a question is beyond your current knowledge, simply state that you don't know rather than fabricating information.",
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
