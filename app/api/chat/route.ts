import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { turso, generateId } from "@/lib/db";

export const maxDuration = 30;

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: Request) {
	const {
		message,
		body: { model, conversationId } = {},
	}: { message: UIMessage; body?: { model?: string; conversationId?: string } } = await req.json();
	console.log("Received model in request:", model, message);

	const targetModel = model && model.trim().length > 0 ? model : "arcee-ai/trinity-mini:free";

	if (!message || !message.parts || message.parts.length === 0) {
		return new Response("Invalid message", { status: 400 });
	}

	const messageText = message.parts
		.filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
		.map((part) => part.text)
		.join("");

	const result = streamText({
		model: openrouter(targetModel),
		messages: convertToModelMessages([message]),
		system:
			"You are a helpful AI assistant. Answer the user's questions to the best of your ability always being concise and reply on markdown format. If you do not know the answer, just say that you do not know. Do not try to make up an answer.",
		async onFinish({ text, reasoning, totalUsage }) {
			console.log("Usage:", totalUsage);
			if (conversationId) {
				await turso.execute({
					sql: "INSERT INTO messages (id, role, content, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
					args: [generateId(), "user", messageText, Date.now(), conversationId],
				});

				// Extract reasoning text if available
				const reasoningText =
					reasoning
						?.filter((r): r is { type: "reasoning"; text: string } => r.type === "reasoning")
						.map((r) => r.text)
						.join("") || null;

				await turso.execute({
					sql: "INSERT INTO messages (id, role, content, reasoning, created_at, conversation_id) VALUES (?, ?, ?, ?, ?, ?)",
					args: [generateId(), "assistant", text, reasoningText, Date.now(), conversationId],
				});

				await turso.execute({
					sql: "UPDATE conversations SET updated_at = ? WHERE id = ?",
					args: [Date.now(), conversationId],
				});
			}
		},
		onError(error) {
			console.error("Stream error:", error);
		},
	});

	// Ensure the stream is consumed so onFinish gets called
	result.consumeStream();

	// sendReasoning: true will stream reasoning tokens to the client (for models that support it)
	return result.toUIMessageStreamResponse({ sendReasoning: true });
}
