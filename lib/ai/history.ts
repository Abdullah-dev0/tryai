import { HISTORY_CHAR_BUDGET, IMAGE_CHAR_COST, MAX_HISTORY_MESSAGES } from "@/lib/limits";
import type { ChatMessage } from "@/lib/types";

function partCost(part: ChatMessage["parts"][number]) {
	if (part.type === "text") return part.text.length;
	return part.type === "file" ? IMAGE_CHAR_COST : 0;
}

export function buildHistory(messages: ChatMessage[], keepImages: boolean): ChatMessage[] {
	const history: ChatMessage[] = [];
	let budget = HISTORY_CHAR_BUDGET;

	for (const [index, message] of messages.slice(-MAX_HISTORY_MESSAGES).reverse().entries()) {
		const isLatest = index === 0;
		const parts = message.parts.filter(
			(part) => part.type === "text" || (part.type === "file" && (keepImages || isLatest)),
		);
		budget -= parts.reduce((sum, part) => sum + partCost(part), 0);
		if (!isLatest && budget < 0) break;

		const next = history[0];
		if (next?.role === message.role) {
			history[0] = { ...next, parts: [...parts, ...next.parts] };
		} else if (parts.length > 0) {
			history.unshift({ ...message, parts });
		}
	}

	while (history.length > 1 && history[0].role !== "user") history.shift();
	return history;
}
