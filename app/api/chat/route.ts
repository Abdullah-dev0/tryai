import { turso } from "@/lib/db";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, generateId, pruneMessages, streamText, type UIMessage } from "ai";

export const maxDuration = 30;

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: Request) {
	const {
		messages,
		body,
		conversationId,
		messageId,
	}: {
		messages: UIMessage[];
		body?: { model?: string };
		conversationId?: string;
		messageId?: string;
	} = await req.json();

	const model = body?.model;
	const targetModel = model && model.trim().length > 0 ? model : "arcee-ai/trinity-mini:free";

	if (!messages || messages.length === 0) {
		return new Response("No messages provided", { status: 400 });
	}

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
	});

	// Consume the stream to ensure it runs to completion even if client disconnects
	result.consumeStream();

	return result.toUIMessageStreamResponse({
		originalMessages: messages,
		onError(error) {
			throw error;
		},
		generateMessageId: () => messageId ?? generateId(),
		async onFinish({ responseMessage }) {
			if (conversationId) {
				if (messages[messages.length - 1].role === "user") {
					await turso.execute({
						sql: "INSERT OR IGNORE INTO messages (id, role, parts, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
						args: [
							messages[messages.length - 1].id,
							"user",
							JSON.stringify(messages[messages.length - 1].parts),
							Date.now(),
							conversationId,
						],
					});
				}

				// Save or update assistant message (ID is guaranteed by generateMessageId)
				if (responseMessage) {
					await turso.execute({
						sql: "INSERT OR REPLACE INTO messages (id, role, parts, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
						args: [responseMessage.id, "assistant", JSON.stringify(responseMessage.parts), Date.now(), conversationId],
					});
				}

				// Update conversation timestamp
				await turso.execute({
					sql: "UPDATE conversations SET updated_at = ? WHERE id = ?",
					args: [Date.now(), conversationId],
				});

				// Delete messages that were removed from the conversation (e.g. after regeneration)
				const validMessageIds = new Set(messages.map((m) => m.id));
				if (responseMessage) {
					validMessageIds.add(responseMessage.id);
				}

				const idsArray = Array.from(validMessageIds);
				if (idsArray.length > 0) {
					const placeholders = idsArray.map(() => "?").join(",");
					await turso.execute({
						sql: `DELETE FROM messages WHERE conversation_id = ? AND id NOT IN (${placeholders})`,
						args: [conversationId, ...idsArray],
					});
				}
			}
		},
	});
}
