export interface OpenRouterModelArchitecture {
	modality: string;
	input_modalities: string[];
	output_modalities: string[];
	tokenizer: string;
	instruct_type: string | null;
}

export interface OpenRouterModelPricing {
	prompt: string;
	completion: string;
	web_search?: string;
	input_cache_read?: string;
	input_cache_write?: string;
	audio?: string;
	request?: string;
	image?: string;
	internal_reasoning?: string;
	[key: string]: string | undefined;
}

export interface OpenRouterTopProvider {
	context_length: number | null;
	max_completion_tokens: number | null;
	is_moderated: boolean;
}

export interface OpenRouterModel {
	id: string;
	canonical_slug: string;
	hugging_face_id: string;
	name: string;
	created: number;
	description: string;
	context_length: number;
	architecture: OpenRouterModelArchitecture;
	pricing: OpenRouterModelPricing;
	top_provider: OpenRouterTopProvider;
	per_request_limits: unknown;
	supported_parameters: string[] | null;
	default_parameters: Record<string, unknown> | null;
	expiration_date: string | null;
}

export interface OpenRouterModelsResponse {
	data: OpenRouterModel[];
}

/** Subset of OpenRouterModel used for UI (detail panel). Shared by server action and model selector. */
export type OpenRouterModelSummary = Pick<
	OpenRouterModel,
	| "id"
	| "name"
	| "description"
	| "context_length"
	| "created"
	| "architecture"
	| "pricing"
	| "supported_parameters"
	| "expiration_date"
>;
