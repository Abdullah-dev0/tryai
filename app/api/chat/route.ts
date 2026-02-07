import { auth } from "@/lib/auth";
import { getConversationForUser } from "@/lib/data/conversation";
import { loadChat, saveChat } from "@/lib/data/chat";
import type { ChatMessage } from "@/lib/types";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { consumeStream, convertToModelMessages, generateId, pruneMessages, streamText } from "ai";
import { headers } from "next/headers";

export const maxDuration = 30;

const defaultOpenRouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

function getOpenRouterClient(customApiKey?: string) {
	if (typeof customApiKey === "string" && customApiKey.trim().length > 0) {
		return createOpenRouter({ apiKey: customApiKey });
	}
	return defaultOpenRouter;
}

const DEFAULT_MODEL = "arcee-ai/trinity-mini:free";

export async function POST(req: Request) {
	let body: { message?: ChatMessage; body?: { model?: unknown; conversationId?: unknown; apiKey?: unknown } };
	try {
		body = await req.json();
	} catch {
		return new Response("Invalid JSON", { status: 400 });
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return new Response("Unauthorized", { status: 401 });
	}

	const { message, body: innerBody } = body;
	const rawModel = innerBody?.model;
	const rawConversationId = innerBody?.conversationId;
	const customApiKey = innerBody?.apiKey;

	const model =
		typeof rawModel === "string" && rawModel.trim().length > 0 ? rawModel.trim() : DEFAULT_MODEL;
	const conversationId =
		typeof rawConversationId === "string" && rawConversationId.trim().length > 0
			? rawConversationId.trim()
			: "";

	if (!message || typeof message !== "object") {
		return new Response("No message provided", { status: 400 });
	}

	if (!conversationId) {
		return new Response("No conversation ID provided", { status: 400 });
	}

	const conversation = await getConversationForUser(session.user.id, conversationId);
	if (!conversation) {
		return new Response("Forbidden", { status: 403 });
	}

	const previousMessages = await loadChat(conversationId);
	const allMessages: ChatMessage[] = [...previousMessages.slice(-3), message];

	const modelMessages = convertToModelMessages(allMessages);
	const prunedMessages = pruneMessages({
		messages: modelMessages,
		reasoning: "all",
		toolCalls: "all",
		emptyMessages: "remove",
	});

	const apiKeyForClient =
		typeof customApiKey === "string" && customApiKey.trim().length > 0 ? customApiKey : undefined;
	const openRouter = getOpenRouterClient(apiKeyForClient);

	const result = streamText({
		model: openRouter(model),
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
		6. "Make it short and concise"
		7. "Do not use any extra words or phrases"

    Focus on high-quality, readable, and actionable information.
  `,
	});

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
