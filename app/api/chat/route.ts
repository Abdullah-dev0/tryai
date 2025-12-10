import { turso } from "@/lib/db";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
	convertToModelMessages,
	createIdGenerator,
	pruneMessages,
	streamText,
	TypeValidationError,
	type UIMessage,
	validateUIMessages,
} from "ai";

export const maxDuration = 30;

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

// Create a consistent message ID generator for server-side persistence
const generateMessageId = createIdGenerator({
	prefix: "msg",
	size: 16,
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
	// Delete existing messages for this conversation
	await turso.execute({
		sql: "DELETE FROM messages WHERE conversation_id = ?",
		args: [chatId],
	});

	// Insert all messages
	for (const msg of messages) {
		await turso.execute({
			sql: "INSERT INTO messages (id, role, parts, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
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

	// Validate messages - handles tools, metadata, and data parts if present
	let validatedMessages: UIMessage[];
	try {
		validatedMessages = await validateUIMessages({
			// Append the new message to the previous messages
			messages: [...previousMessages, message],
		});
	} catch (error) {
		if (error instanceof TypeValidationError) {
			// Log validation error for monitoring
			console.error("Message validation failed:", error);
			// Fall back to just the new message if history is corrupted
			validatedMessages = [message];
		} else {
			throw error;
		}
	}

	const modelMessages = convertToModelMessages(validatedMessages);

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

	result.consumeStream();

	return result.toUIMessageStreamResponse({
		originalMessages: validatedMessages,
		onError(error) {
			throw error;
		},
		// Generate consistent server-side IDs for persistence
		generateMessageId,
		async onFinish({ messages }) {
			// Save ALL messages (following the docs pattern)
			await saveChat({ chatId: conversationId, messages });
		},
	});
}
