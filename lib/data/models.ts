import type { OpenRouterModel, OpenRouterModelsResponse } from "@/lib/types/openrouter";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

export async function getOpenRouterModels(): Promise<OpenRouterModel[]> {
	const res = await fetch(OPENROUTER_MODELS_URL, {
		next: { revalidate: 86400 },
	});

	if (!res.ok) {
		console.warn("[openrouter] Models API error:", res.status);
		return [];
	}

	const json: OpenRouterModelsResponse = await res.json();
	return Array.isArray(json?.data) ? json.data : [];
}
