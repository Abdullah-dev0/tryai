"use server";

import type { ModelOption } from "@/lib/constants";
import { getOpenRouterModels } from "@/lib/data/models";
import { isFreeModel, openRouterModelToOption } from "@/lib/utils";
import type { OpenRouterModelSummary } from "@/lib/types/openrouter";

export interface ModelsActionResult {
	options: ModelOption[];
	models: OpenRouterModelSummary[];
}

export async function getModels(includePaid = false): Promise<ModelsActionResult> {
	try {
		const list = await getOpenRouterModels();
		const visible = includePaid ? list : list.filter(isFreeModel);

		const options = visible.map(openRouterModelToOption);
		const models = visible.map((m) => ({
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
