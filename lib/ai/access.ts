import { getOpenRouterModels } from "@/lib/data/models";
import { getQuotaStatus } from "@/lib/data/usage";
import { AUTO_MODEL, DAILY_TOKEN_LIMIT, FREE_ROUTER_MODEL, REQUESTS_PER_MINUTE, isFreeModelId } from "@/lib/limits";
import { hasVision } from "@/lib/utils";
import type { ChatOptions } from "./validation";

type AccessResult =
	| { ok: true; modelId: string; supportsImages: boolean }
	| { ok: false; status: number; message: string };

function denied(status: number, message: string): AccessResult {
	return { ok: false, status, message };
}

export async function checkAccess({
	userId,
	options,
	withImages,
}: {
	userId: string;
	options: ChatOptions;
	withImages: boolean;
}): Promise<AccessResult> {
	let modelId = options.model;

	if (!options.apiKey) {
		if (options.webSearch) return denied(403, "Web search needs your own OpenRouter API key.");
		if (modelId === AUTO_MODEL) modelId = FREE_ROUTER_MODEL;
		if (!isFreeModelId(modelId)) return denied(403, "This model needs your own OpenRouter API key.");

		const quota = await getQuotaStatus(userId);
		if (quota.requestsLastMinute >= REQUESTS_PER_MINUTE) {
			return denied(429, "Too many requests. Wait a minute and try again.");
		}
		if (quota.tokensToday >= DAILY_TOKEN_LIMIT) {
			return denied(429, "Daily free limit reached. Add your own OpenRouter API key or come back tomorrow.");
		}
	}

	const models = await getOpenRouterModels().catch(() => []);
	const info = models.find((m) => m.id === modelId);
	const supportsImages = hasVision(info?.architecture);
	if (withImages && info && !supportsImages) {
		return denied(400, "This model cannot read images. Pick a vision model.");
	}

	return { ok: true, modelId, supportsImages };
}
