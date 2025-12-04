import { getConversation } from "@/app/actions/actions";
import { turso } from "@/lib/db";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

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
	const previousMessages: UIMessage[] = previousConversation?.messages ?? [];

	// Combine previous messages with the new message
	const messages = [...previousMessages, message];

	const result = streamText({
		model: openrouter(targetModel),
		messages: convertToModelMessages(messages),
		system:
			"You are a helpful AI assistant. Answer the user's questions to the best of your ability always being concise and reply on markdown format. If you do not know the answer, just say that you do not know. Do not try to make up an answer.",
		onError(error) {
			console.error("Stream error:", error);
		},
	});

	// Consume the stream to ensure it runs to completion even if client disconnects
	result.consumeStream();

	return result.toUIMessageStreamResponse({
		sendReasoning: true,
		originalMessages: messages,
		async onFinish({ messages: finalMessages }) {
			if (conversationId) {
				// Get the last two messages (user message and assistant response)
				const userMsg = finalMessages[finalMessages.length - 2];
				const assistantMsg = finalMessages[finalMessages.length - 1];

				// Save user message
				if (userMsg && userMsg.role === "user") {
					await turso.execute({
						sql: "INSERT INTO messages (id, role, parts, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
						args: [userMsg.id, "user", JSON.stringify(userMsg.parts), Date.now(), conversationId],
					});
				}

				// Save assistant message
				if (assistantMsg && assistantMsg.role === "assistant") {
					await turso.execute({
						sql: "INSERT INTO messages (id, role, parts, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
						args: [assistantMsg.id, "assistant", JSON.stringify(assistantMsg.parts), Date.now(), conversationId],
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
}
