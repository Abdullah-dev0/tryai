import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { turso, generateId } from "@/lib/db";

export const maxDuration = 30;

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: Request) {
	const { messages, model, conversationId }: { messages: UIMessage[]; model?: string; conversationId?: string } =
		await req.json();

	// Save user message
	const lastMessage = messages[messages.length - 1];
	if (lastMessage.role === "user" && conversationId) {
		const textContent = lastMessage.parts
			.filter((part): part is { type: "text"; text: string } => part.type === "text")
			.map((part) => part.text)
			.join("");

		await turso.execute({
			sql: "INSERT INTO messages (id, role, content, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
			args: [generateId(), "user", textContent, Date.now(), conversationId],
		});

		await turso.execute({
			sql: "UPDATE conversations SET updated_at = ? WHERE id = ?",
			args: [Date.now(), conversationId],
		});
	}

	const result = streamText({
		model: openrouter("arcee-ai/trinity-mini:free"),
		messages: convertToModelMessages(messages),
		async onFinish({ text }) {
			if (conversationId) {
				await turso.execute({
					sql: "INSERT INTO messages (id, role, content, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
					args: [generateId(), "assistant", text, Date.now(), conversationId],
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
