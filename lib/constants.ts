import { Sparkles, Compass, Code2, GraduationCap, LucideIcon } from "lucide-react";

// ============================================
// Chat Interface Constants
// ============================================

export interface QuickAction {
	icon: LucideIcon;
	label: string;
	color: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
	{ icon: Sparkles, label: "Create", color: "text-purple-400" },
	{ icon: Compass, label: "Explore", color: "text-blue-400" },
	{ icon: Code2, label: "Code", color: "text-green-400" },
	{ icon: GraduationCap, label: "Learn", color: "text-orange-400" },
];

export const SUGGESTED_PROMPTS: string[] = [
	"Explain quantum entanglement and its implications",
	"How does machine learning differ from traditional programming?",
	"What are the trade-offs between microservices and monolithic architecture?",
	"How do you implement dependency injection in TypeScript?",
	"Explain the event loop in JavaScript and how it handles async operations",
];

// ============================================
// Model Selector Constants
// ============================================

export type ModelBrand =
	| "meta"
	| "google"
	| "qwen"
	| "openai"
	| "mistral"
	| "microsoft"
	| "deepseek"
	| "thudm"
	| "sarvam"
	| "zhipu"
	| "amazon"
	| "kwaipilot"
	| "nvidia";

export interface ModelOption {
	value: string;
	label: string;
	tagline: string;
	context: string;
	inputs: string;
	brand: ModelBrand;
	isReasoning?: boolean;
}

export const BRAND_COLORS: Record<ModelBrand, string> = {
	meta: "#0668E1",
	google: "#4285F4",
	qwen: "#6C5CE7",
	openai: "#10A37F",
	mistral: "#F97316",
	microsoft: "#00A4EF",
	deepseek: "#0066FF",
	thudm: "#FF6B35",
	sarvam: "#FF5722",
	zhipu: "#00D4AA",
	amazon: "#FF9900",
	kwaipilot: "#FF3366",
	nvidia: "#76b900",
};

/** Single-letter label for brand icon (e.g. "M" for meta) */
export const BRAND_LABELS: Record<ModelBrand, string> = {
	meta: "M",
	google: "G",
	qwen: "Q",
	openai: "O",
	mistral: "M",
	microsoft: "MS",
	deepseek: "D",
	thudm: "T",
	sarvam: "S",
	zhipu: "Z",
	amazon: "A",
	kwaipilot: "K",
	nvidia: "N",
};

export const DEFAULT_MODEL: ModelOption[] = [
	{
		value: "openrouter/auto",
		label: "Auto",
		tagline: "Auto-select the best model for your prompt",
		context: "0",
		inputs: "Text",
		brand: "meta",
		isReasoning: false,
	},
];
