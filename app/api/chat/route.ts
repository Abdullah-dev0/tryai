import { auth } from "@/lib/auth";
import { checkAccess } from "@/lib/ai/access";
import { streamChat } from "@/lib/ai/chatRequest";
import { hasImages, messageText, parseChatOptions, parseUserMessage } from "@/lib/ai/validation";
import { getConversationForUser } from "@/lib/data/conversation";
import { deleteMessages, loadChat, saveAssistantMessage, saveUserMessage, setTitleIfEmpty } from "@/lib/data/chat";
import { titleFromText } from "@/lib/utils";
import { headers } from "next/headers";

export const maxDuration = 30;

export async function POST(req: Request) {
	let body: Record<string, unknown>;
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

	const options = parseChatOptions(body);
	if (!options) {
		return new Response("Invalid model", { status: 400 });
	}

	const message = parseUserMessage(body.message);
	if (!message) {
		return new Response("Invalid message", { status: 400 });
	}

	const conversationId = typeof body.conversationId === "string" ? body.conversationId.trim() : "";
	if (!conversationId) {
		return new Response("No conversation ID provided", { status: 400 });
	}

	const conversation = await getConversationForUser(session.user.id, conversationId);
	if (!conversation) {
		return new Response("Forbidden", { status: 403 });
	}

	const access = await checkAccess({ userId: session.user.id, options, withImages: hasImages(message) });
	if (!access.ok) {
		return new Response(access.message, { status: access.status });
	}

	const previousMessages = await loadChat(conversationId);
	const existingIndex = previousMessages.findIndex((m) => m.id === message.id);
	let allMessages = [...previousMessages, message];

	if (existingIndex >= 0) {
		if (previousMessages[existingIndex].role !== "user") {
			return new Response("Invalid message", { status: 400 });
		}
		await deleteMessages(
			conversationId,
			previousMessages.slice(existingIndex + 1).map((m) => m.id),
		);
		allMessages = previousMessages.slice(0, existingIndex + 1);
	} else {
		await saveUserMessage({ chatId: conversationId, message });
	}

	if (!conversation.title) {
		await setTitleIfEmpty(conversationId, titleFromText(messageText(allMessages[0])));
	}

	return streamChat({
		userId: session.user.id,
		modelId: access.modelId,
		options,
		messages: allMessages,
		keepImages: access.supportsImages,
		abortSignal: req.signal,
		onSave: (responseMessage, info) =>
			saveAssistantMessage({ chatId: conversationId, message: responseMessage, ...info }),
	});
}
