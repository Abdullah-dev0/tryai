import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { consumeStream, convertToModelMessages, generateId, streamText } from "ai";
import { reserveUsage, settleUsage } from "@/lib/data/usage";
import { MAX_OUTPUT_TOKENS, WEB_SEARCH_MAX_RESULTS } from "@/lib/limits";
import type { ChatMessage } from "@/lib/types";
import { buildHistory } from "./history";
import { SYSTEM_PROMPT } from "./prompt";
import { messageText, type ChatOptions } from "./validation";

const defaultOpenRouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

function finiteOrZero(value: unknown) {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readCost(providerMetadata: unknown) {
	const usage = (providerMetadata as { openrouter?: { usage?: { cost?: unknown } } } | undefined)?.openrouter?.usage;
	return finiteOrZero(usage?.cost);
}

function describeError(error: unknown): string {
	const source = (error as { lastError?: unknown } | null)?.lastError ?? error;
	const details = (source ?? {}) as { statusCode?: unknown; code?: unknown; metadata?: { error_type?: unknown } };
	const status = finiteOrZero(details.statusCode) || finiteOrZero(details.code);

	if (status === 429) return "This model is busy right now. Try again shortly or pick another model.";
	if (status === 401) return "OpenRouter rejected the API key. Check your key and try again.";
	if (status === 402) return "Not enough OpenRouter credits for this request.";
	if (status >= 500 || details.metadata?.error_type === "provider_unavailable") {
		return "The model's provider is unavailable right now. Try again or pick another model.";
	}
	return "The model returned an error. Try again or pick another model.";
}

export async function streamChat({
	userId,
	modelId,
	options,
	messages,
	keepImages,
	abortSignal,
	onSave,
}: {
	userId: string;
	modelId: string;
	options: ChatOptions;
	messages: ChatMessage[];
	keepImages: boolean;
	abortSignal: AbortSignal;
	onSave?: (message: ChatMessage, info: { model: string; tokens: number }) => Promise<void>;
}) {
	const ownKey = Boolean(options.apiKey);
	const openRouter = options.apiKey ? createOpenRouter({ apiKey: options.apiKey }) : defaultOpenRouter;
	const usageId = await reserveUsage({ userId, model: modelId, ownKey });
	const startedAt = Date.now();

	let actualModel = modelId;
	let cost = 0;
	let firstTokenAt: number | undefined;
	let hasError = false;

	const result = streamText({
		model: openRouter(modelId, {
			usage: { include: true },
			...(options.webSearch ? { plugins: [{ id: "web" as const, max_results: WEB_SEARCH_MAX_RESULTS }] } : {}),
		}),
		messages: convertToModelMessages(buildHistory(messages, keepImages)),
		system: SYSTEM_PROMPT,
		maxOutputTokens: ownKey ? undefined : MAX_OUTPUT_TOKENS,
		abortSignal,
		onChunk({ chunk }) {
			if (firstTokenAt === undefined && (chunk.type === "text-delta" || chunk.type === "reasoning-delta")) {
				firstTokenAt = Date.now();
			}
		},
		async onFinish({ totalUsage, providerMetadata, response }) {
			try {
				await settleUsage(usageId, {
					model: response.modelId || modelId,
					totalTokens: finiteOrZero(totalUsage.totalTokens),
					cost: readCost(providerMetadata),
				});
			} catch (error) {
				console.error("Failed to record usage:", error);
			}
		},
	});

	return result.toUIMessageStreamResponse<ChatMessage>({
		originalMessages: messages,
		generateMessageId: generateId,
		consumeSseStream: consumeStream,
		sendSources: options.webSearch,
		onError(error) {
			console.error("Streaming error:", error);
			hasError = true;
			return describeError(error);
		},
		messageMetadata: ({ part }) => {
			if (part.type === "finish-step") {
				actualModel = part.response.modelId || actualModel;
				cost += readCost(part.providerMetadata);
			}
			if (part.type === "finish") {
				const now = Date.now();
				return {
					tokens: finiteOrZero(part.totalUsage.totalTokens),
					model: actualModel,
					cost,
					ttftMs: (firstTokenAt ?? now) - startedAt,
					durationMs: now - startedAt,
				};
			}
		},
		async onFinish({ responseMessage }) {
			if (hasError || !onSave || !messageText(responseMessage).trim()) return;
			try {
				await onSave(responseMessage, { model: actualModel, tokens: responseMessage.metadata?.tokens ?? 0 });
			} catch (error) {
				console.error("Failed to save response:", error);
			}
		},
	});
}
