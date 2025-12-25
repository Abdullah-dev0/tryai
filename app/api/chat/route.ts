import { turso } from "@/lib/db";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { consumeStream, convertToModelMessages, generateId, pruneMessages, streamText } from "ai";
import type { ChatMessage } from "@/lib/types";

export const maxDuration = 30;

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

// Helper to load chat messages from database (following docs pattern)
async function loadChat(id: string): Promise<ChatMessage[]> {
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
async function saveChat({ chatId, messages }: { chatId: string; messages: ChatMessage[] }) {
	// Only save the last 2 messages (user message + AI response)
	// Previous messages are already persisted in the database
	const userMessage = messages.at(-2); // Second to last = user message
	const aiMessage = messages.at(-1); // Last = AI response

	const messagesToSave = [userMessage, aiMessage].filter(Boolean) as ChatMessage[];

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

	// Update conversation timestamp and add tokens
	await turso.execute({
		sql: "UPDATE conversations SET updated_at = ?, total_tokens = COALESCE(total_tokens, 0) + ? WHERE id = ?",
		args: [Date.now(), messages.at(-1)?.metadata?.tokens ?? 0, chatId],
	});
}

export async function POST(req: Request) {
	const { message, body } = (await req.json()) as {
		message: ChatMessage;
		body?: { model?: string; conversationId?: string };
	};
	const model = body?.model;
	const conversationId = body?.conversationId;

	const targetModel = model && model.trim().length > 0 ? model : "arcee-ai/trinity-mini:free";

	if (!message) {
		return new Response("No message provided", { status: 400 });
	}

	if (!conversationId) {
		return new Response("No conversation ID provided what", { status: 400 });
	}

	// Load previous messages from database
	const previousMessages = await loadChat(conversationId);

	// Combine messages with proper typing for originalMessages
	const allMessages: ChatMessage[] = [...previousMessages.slice(0, -3), message];

	const modelMessages = convertToModelMessages(allMessages);

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
			"You are a highly educated and knowledgeable AI assistant with expertise across multiple domains. Provide thoughtful, accurate, and well-reasoned answers to user queries. Always format responses using Markdown for clarity and readability. When uncertain, acknowledge the limitation rather than speculating. Demonstrate intellectual rigor and depth in your explanations.",
	});

	// Track if an error occurs during streaming
	let hasError = false;

	return result.toUIMessageStreamResponse({
		originalMessages: allMessages,
		generateMessageId: generateId,
		consumeSseStream: consumeStream,
		onError(error) {
			console.error("Streaming error:", error);
			hasError = true;
			return error instanceof Error ? error.message : String(error);
		},
		messageMetadata: ({ part }) => {
			if (part.type === "finish") {
				return {
					tokens: part.totalUsage.totalTokens ?? 0,
				};
			}
		},
		async onFinish({ messages }) {
			if (hasError) return;
			await saveChat({ chatId: conversationId, messages });
		},
	});
}
