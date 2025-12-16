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

// Brand colors for model icons
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
	nvidia: "#FF3366",
};

export const MODELS: ModelOption[] = [
	// Meta Models
	{
		value: "meta-llama/llama-3.2-3b-instruct:free",
		label: "Llama 3.2 3B Instruct",
		tagline: "Multilingual model for dialogue & reasoning",
		context: "131K ctx",
		inputs: "Text",
		brand: "meta",
		isReasoning: false,
	},
	// Qwen Models
	{
		value: "qwen/qwen3-4b:free",
		label: "Qwen3 4B",
		tagline: "Dual-mode thinking & non-thinking",
		context: "41K ctx",
		inputs: "Text",
		brand: "qwen",
		isReasoning: true,
	},
	// Google Gemma Models
	{
		value: "google/gemma-3-4b-it:free",
		label: "Gemma 3 4B",
		tagline: "Multimodal vision-language model",
		context: "33K ctx",
		inputs: "Text, Vision",
		brand: "google",
		isReasoning: false,
	},
	{
		value: "google/gemma-3-12b-it:free",
		label: "Gemma 3 12B",
		tagline: "Larger Gemma 3 with advanced reasoning",
		context: "33K ctx",
		inputs: "Text, Vision",
		brand: "google",
		isReasoning: false,
	},
	{
		value: "google/gemma-3n-e2b-it:free",
		label: "Gemma 3n 2B",
		tagline: "Efficient on-device multimodal model",
		context: "8K ctx",
		inputs: "Text, Vision, Audio",
		brand: "google",
		isReasoning: false,
	},
	{
		value: "google/gemma-3n-e4b-it:free",
		label: "Gemma 3n 4B",
		tagline: "Mobile-optimized multimodal model",
		context: "8K ctx",
		inputs: "Text, Vision, Audio",
		brand: "google",
		isReasoning: false,
	},
	// OpenAI Models
	{
		value: "openai/gpt-oss-120b:free",
		label: "GPT-OSS 120B",
		tagline: "MoE model for agentic reasoning",
		context: "131K ctx",
		inputs: "Text",
		brand: "openai",
		isReasoning: true,
	},
	// DeepSeek Models
	{
		value: "tngtech/deepseek-r1t2-chimera:free",
		label: "DeepSeek R1T2 Chimera",
		tagline: "DeepSeek R1T2 Chimera",
		context: "163K ctx",
		inputs: "Text",
		brand: "deepseek",
		isReasoning: true,
	},
	// Zhipu Models
	{
		value: "zhipu-ai/glm-4-air:free",
		label: "GLM 4 Air",
		tagline: "Zhipu free model",
		context: "128K ctx",
		inputs: "Text",
		brand: "zhipu",
		isReasoning: false,
	},

	// Amazon Models
	{
		value: "amazon/nova-2-lite-v1:free",
		label: "Nova 2 Lite",
		tagline: "Fast, cost-effective reasoning model for text, images, and videos.",
		context: "1M ctx",
		inputs: "Text, Vision, Video",
		brand: "amazon",
		isReasoning: true,
	},
	{
		value: "kwaipilot/kat-coder-pro:free",
		label: "Kwaipilot KAT-Coder-Pro V1",
		tagline: "Advanced agentic coding model",
		context: "256K ctx",
		inputs: "Text",
		brand: "kwaipilot",
		isReasoning: true,
	},
	// NVIDIA Models
	{
		value: "nvidia/nemotron-3-nano-30b-a3b:free",
		label: "NVIDIA Nemotron 3 Nano 30B A3B",
		tagline: "Small language MoE model for specialized agentic AI systems.",
		context: "256K ctx",
		inputs: "Text",
		brand: "nvidia",
		isReasoning: true,
	},
];

export const DEFAULT_MODEL = "openrouter/auto";
