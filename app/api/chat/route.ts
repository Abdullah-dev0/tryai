import { db, messages, conversations } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { consumeStream, convertToModelMessages, generateId, pruneMessages, streamText } from "ai";
import type { ChatMessage } from "@/lib/types";
import { getSession } from "@/lib/data/auth";

export const maxDuration = 30;

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

// Helper to load chat messages from database (following docs pattern)
async function loadChat(id: string): Promise<ChatMessage[]> {
	const result = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);

	return result.map((row) => ({
		id: row.id,
		role: row.role as "user" | "assistant",
		parts: JSON.parse(row.parts),
	}));
}

// Helper to save all chat messages to database (following docs pattern)
async function saveChat({ chatId, messages: chatMessages }: { chatId: string; messages: ChatMessage[] }) {
	// Only save the last 2 messages (user message + AI response)
	// Previous messages are already persisted in the database
	const userMessage = chatMessages.at(-2); // Second to last = user message
	const aiMessage = chatMessages.at(-1); // Last = AI response

	const messagesToSave = [userMessage, aiMessage].filter(Boolean) as ChatMessage[];

	const baseTime = Date.now();
	for (const msg of messagesToSave) {
		// Ensure deterministic order by adding index to baseTime
		// This guarantees that later messages always have a later timestamp
		// regardless of how fast the code executes
		const orderOffset = messagesToSave.indexOf(msg);
		const timestamp = baseTime + orderOffset;

		await db
			.insert(messages)
			.values({
				id: msg.id,
				role: msg.role as "user" | "assistant",
				parts: JSON.stringify(msg.parts),
				createdAt: timestamp,
				conversationId: chatId,
			})
			.onConflictDoUpdate({
				target: messages.id,
				set: {
					role: msg.role as "user" | "assistant",
					parts: JSON.stringify(msg.parts),
					createdAt: timestamp,
				},
			});
	}

	// Update conversation timestamp and add tokens
	const tokensToAdd = chatMessages.at(-1)?.metadata?.tokens ?? 0;
	await db
		.update(conversations)
		.set({
			updatedAt: Date.now(),
			totalTokens: sql`COALESCE(${conversations.totalTokens}, 0) + ${tokensToAdd}`,
		})
		.where(eq(conversations.id, chatId));
}

export async function POST(req: Request) {
	const { message, body } = (await req.json()) as {
		message: ChatMessage;
		body?: { model?: string; conversationId?: string };
	};
	const model = body?.model;
	const conversationId = body?.conversationId;

	const session = await getSession();

	if (!session?.user) {
		return new Response("Unauthorized", { status: 401 });
	}

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
	const allMessages: ChatMessage[] = [...previousMessages.slice(-3), message];

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
		system: `
    You are a highly capable and intelligent AI assistant. 
    Your goal is to provide accurate, concise, and helpful responses to a broad public audience.

    ## Guidelines:
    1. **Directness:** Answer the user's question immediately. Do not use filler phrases like "I can help with that" or "Here is the answer."
    2. **Tone:** Maintain a professional, neutral, and "real" tone. Avoid being overly enthusiastic or robotic.
    3. **Formatting:** Always use Markdown. 
       - Use **bold** for key concepts.
       - Use lists for steps or multiple points.
       - Use code blocks with language tags (e.g., \`\`\`json) for technical content.
    4. **Accuracy:** If you do not know an answer, admit it. Do not hallucinate facts.
    5. **Safety:** If a user requests harmful, illegal, or explicit content, politely refuse.

    Focus on high-quality, readable, and actionable information.
  `,
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
		async onFinish({ messages: finishedMessages }) {
			if (hasError) return;
			await saveChat({ chatId: conversationId, messages: finishedMessages });
		},
	});
}
