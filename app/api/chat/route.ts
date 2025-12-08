import { getConversation } from "@/app/actions/actions";
import { turso } from "@/lib/db";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, generateId, pruneMessages, streamText, type UIMessage } from "ai";

export const maxDuration = 30;

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: Request) {
	const {
		message,
		body: { model, conversationId } = {},
	}: { message: UIMessage; body?: { model?: string; conversationId?: string } } = await req.json();

	const targetModel = model && model.trim().length > 0 ? model : "arcee-ai/trinity-mini:free";

	if (!message || !message.parts || message.parts.length === 0) {
		return new Response("Invalid message", { status: 400 });
	}

	// Load previous messages from database (already in UIMessage format)
	const previousConversation = await getConversation(conversationId!);
	const previousMessages: UIMessage[] = previousConversation?.messages.slice(-3) ?? [];

	// Combine previous messages with the new message
	const messages = [...previousMessages, message];

	const modelMessages = convertToModelMessages(messages);

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
		onError(error) {
			throw error;
		},
		async onFinish({ text, reasoningText }) {
			if (conversationId) {
				// Save user message
				if (message && message.role === "user") {
					await turso.execute({
						sql: "INSERT OR IGNORE INTO messages (id, role, parts, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
						args: [message.id, "user", JSON.stringify(message.parts), Date.now(), conversationId],
					});
				}

				// Save assistant message - generate ID if missing
				if (text) {
					// Build parts array in UIMessage format
					const parts: UIMessage["parts"] = [];

					// Add reasoning part first if present (matches UIMessage ReasoningUIPart)
					if (reasoningText) {
						parts.push({
							type: "reasoning",
							text: reasoningText,
						});
					}

					// Add text part
					parts.push({
						type: "text",
						text,
					});

					await turso.execute({
						sql: "INSERT OR REPLACE INTO messages (id, role, parts, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
						args: [generateId(), "assistant", JSON.stringify(parts), Date.now(), conversationId],
					});
				}

				// Update conversation timestamp
				await turso.execute({
					sql: "UPDATE conversations SET updated_at = ? WHERE id = ?",
					args: [Date.now(), conversationId],
				});
			}
		},
	});

	// Consume the stream to ensure it runs to completion even if client disconnects
	result.consumeStream();

	return result.toUIMessageStreamResponse();
}
