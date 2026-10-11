import { clsx, type ClassValue } from "clsx";
import type { OpenRouterModelArchitecture } from "@/lib/types/openrouter";
import { twMerge } from "tailwind-merge";
import type { ModelOption } from "@/lib/constants";
import type { OpenRouterModel } from "@/lib/types/openrouter";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Helper to strip markdown formatting for clean display
export function stripMarkdown(text: string): string {
	return text
		.replace(/[#*_`~>[\]()]/g, "") // Remove markdown symbols
		.replace(/\n+/g, " ") // Replace newlines with space
		.replace(/\s+/g, " ") // Collapse multiple spaces
		.trim();
}

export function titleFromText(text: string, maxLength = 60): string {
	const chars = Array.from(stripMarkdown(text));
	if (chars.length === 0) return "New chat";
	return chars.length > maxLength ? chars.slice(0, maxLength).join("").trimEnd() + "…" : chars.join("");
}

export function shortModelName(id: string): string {
	return (id.split("/").pop() ?? id).replace(/:free$/, "");
}

interface MarkdownExportMessage {
	role: string;
	parts: { type: string; text?: string; url?: string; title?: string }[];
}

export function messagesToMarkdown(title: string, messages: MarkdownExportMessage[]): string {
	const sections = messages.map((message) => {
		const text = message.parts
			.filter((part) => part.type === "text")
			.map((part) => part.text ?? "")
			.join("");
		const images = message.parts.filter((part) => part.type === "file").length;
		const sources = message.parts
			.filter((part) => part.type === "source-url" && part.url)
			.map((part) => `- [${part.title ?? part.url}](${part.url})`);
		return [
			`## ${message.role === "user" ? "You" : "Assistant"}`,
			text,
			images > 0 ? `_${images} image${images > 1 ? "s" : ""} attached_` : "",
			sources.length > 0 ? `**Sources**\n${sources.join("\n")}` : "",
		]
			.filter(Boolean)
			.join("\n\n");
	});
	return [`# ${title}`, ...sections].join("\n\n") + "\n";
}

// Generic type for items with date fields
interface DateGroupable {
	updatedAt: Date;
}

// Helper to group items by date
export function groupByDate<T extends DateGroupable>(items: T[]) {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
	const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

	const groups: { label: string; items: T[] }[] = [
		{ label: "Today", items: [] },
		{ label: "Yesterday", items: [] },
		{ label: "Previous 7 Days", items: [] },
		{ label: "Older", items: [] },
	];

	items?.forEach((item) => {
		const date = new Date(item.updatedAt);
		if (date >= today) {
			groups[0].items.push(item);
		} else if (date >= yesterday) {
			groups[1].items.push(item);
		} else if (date >= lastWeek) {
			groups[2].items.push(item);
		} else {
			groups[3].items.push(item);
		}
	});

	return groups.filter((g) => g.items.length > 0);
}

// Model selector helpers (OpenRouter model display)
export function hasVision(architecture: OpenRouterModelArchitecture | undefined): boolean {
	return architecture?.input_modalities?.some((modality) => modality.toLowerCase() === "image") ?? false;
}

export function hasToolCalling(supported: string[] | null): boolean {
	return Boolean(supported?.some((p) => /tool|function|json_schema/i.test(p)));
}

export function getProviderFromId(id: string): string {
	const prefix = id.split("/")[0] ?? id;
	return prefix
		.split("-")
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
		.join(" ");
}

export function formatAddedOn(created: number): string {
	if (!created) return "—";
	const d = new Date(created * 1000);
	return d.toLocaleDateString("en-US", {
		month: "numeric",
		day: "numeric",
		year: "numeric",
	});
}

/** Map OpenRouter model to ModelOption for the selector */
export function openRouterModelToOption(m: OpenRouterModel): ModelOption {
	const inputs = m.architecture.input_modalities?.join(", ") ?? "Text";
	const isReasoning = m.supported_parameters?.includes("reasoning") ?? false;
	return {
		value: m.id,
		label: m.name,
		tagline: m.description.slice(0, 120) + (m.description.length > 120 ? "…" : ""),
		context: formatContextLength(m.context_length),
		inputs,
		brand: "meta",
		isReasoning,
	};
}

/** Free models have "0" for both prompt and completion pricing */
export function isFreeModel(model: OpenRouterModel) {
	return model.id.includes(":free");
}

/** Format context length for display (e.g. 131072 -> "131K ctx") */
export function formatContextLength(ctx: number): string {
	if (ctx >= 1_000_000) return `${ctx / 1_000_000}M ctx`;
	if (ctx >= 1_000) return `${Math.round(ctx / 1_000)}K ctx`;
	return `${ctx} ctx`;
}
