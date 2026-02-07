"use server";

import type { ModelOption } from "@/lib/constants";
import { isFreeModel, openRouterModelToOption } from "@/lib/utils";
import type { OpenRouterModel, OpenRouterModelsResponse, OpenRouterModelSummary } from "@/lib/types/openrouter";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

export interface ModelsActionResult {
	options: ModelOption[];
	models: OpenRouterModelSummary[];
}

export async function getModels(): Promise<ModelsActionResult> {
	try {
		const res = await fetch(OPENROUTER_MODELS_URL, {
			next: { revalidate: 86400 },
		});

		if (!res.ok) {
			console.warn("[openrouter] Models API error:", res.status);
			return { options: [], models: [] };
		}

		const json: OpenRouterModelsResponse = await res.json();
		const list: OpenRouterModel[] = Array.isArray(json?.data) ? json.data : [];
		const freeModels = list.filter(isFreeModel);

		const options = freeModels.map(openRouterModelToOption);
		const models = freeModels.map((m) => ({
			id: m.id,
			name: m.name,
			description: m.description,
			context_length: m.context_length,
			created: m.created,
			architecture: m.architecture,
			pricing: m.pricing,
			supported_parameters: m.supported_parameters,
			expiration_date: m.expiration_date,
		}));

		return { options, models };
	} catch (e) {
		const message = e instanceof Error ? e.message : "Failed to fetch models";
		throw new Error(message);
	}
}
