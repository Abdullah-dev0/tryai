import { auth } from "@/lib/auth";
import { checkAccess } from "@/lib/ai/access";
import { streamChat } from "@/lib/ai/chatRequest";
import { hasImages, parseChatOptions, parseMessage } from "@/lib/ai/validation";
import { COMPARE_MAX_MESSAGES } from "@/lib/limits";
import type { ChatMessage } from "@/lib/types";
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

	const rawMessages = Array.isArray(body.messages) ? body.messages.slice(-COMPARE_MAX_MESSAGES) : [];
	const messages = rawMessages
		.map(parseMessage)
		.filter((m): m is ChatMessage => m !== null);

	if (messages.at(-1)?.role !== "user") {
		return new Response("Invalid message", { status: 400 });
	}

	const access = await checkAccess({
		userId: session.user.id,
		options: { ...options, webSearch: false },
		withImages: messages.some(hasImages),
	});
	if (!access.ok) {
		return new Response(access.message, { status: access.status });
	}

	return streamChat({
		userId: session.user.id,
		modelId: access.modelId,
		options: { ...options, webSearch: false },
		messages,
		keepImages: access.supportsImages,
		abortSignal: req.signal,
	});
}
