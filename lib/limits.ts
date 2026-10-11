export const AUTO_MODEL = "openrouter/auto";
export const FREE_ROUTER_MODEL = "openrouter/free";

export const DAILY_TOKEN_LIMIT = 100_000;
export const REQUESTS_PER_MINUTE = 10;
export const MAX_OUTPUT_TOKENS = 4000;

export const HISTORY_CHAR_BUDGET = 24_000;
export const MAX_HISTORY_MESSAGES = 30;
export const IMAGE_CHAR_COST = 5_000;
export const MAX_MESSAGE_CHARS = 20_000;

export const MAX_IMAGES_PER_MESSAGE = 3;
export const MAX_IMAGE_DATA_URL_LENGTH = 700_000;
export const IMAGE_MAX_DIMENSION = 1024;

export const WEB_SEARCH_MAX_RESULTS = 3;
export const COMPARE_MAX_MESSAGES = 20;

export function isFreeModelId(id: string) {
	return id === FREE_ROUTER_MODEL || id.endsWith(":free");
}
