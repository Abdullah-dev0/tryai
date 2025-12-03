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

	const result = streamText({
		model: openrouter(targetModel),
		messages: convertToModelMessages([message]),
		system:
			"You are a helpful AI assistant. Answer the user's questions to the best of your ability always being concise and reply on markdown format. If you do not know the answer, just say that you do not know. Do not try to make up an answer.",
		async onFinish({ text }) {
			if (conversationId) {
				await turso.execute({
					sql: "INSERT INTO messages (id, role, content, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
					args: [generateId(), "assistant", text, Date.now(), conversationId],
				});

				await turso.execute({
					sql: "INSERT INTO messages (id, role, content, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
					args: [generateId(), "user", message.parts.map((text) => text).join(""), Date.now(), conversationId],
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

	return result.toUIMessageStreamResponse();
}
