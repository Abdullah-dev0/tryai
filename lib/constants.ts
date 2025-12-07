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
	"How does AI work?",
	"Are black holes real?",
	'How many Rs are in the word "strawberry"?',
	"What is the meaning of life?",
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
	| "zhipu";

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
	// Mistral Models
	{
		value: "mistralai/mistral-7b-instruct:free",
		label: "Mistral 7B Instruct",
		tagline: "Fast and efficient open model",
		context: "32K ctx",
		inputs: "Text",
		brand: "mistral",
		isReasoning: false,
	},
	{
		value: "mistralai/mistral-nemo:free",
		label: "Mistral Nemo",
		tagline: "Balanced free model",
		context: "131K ctx",
		inputs: "Text",
		brand: "mistral",
		isReasoning: false,
	},
	{
		value: "mistralai/mistral-small-3.2-24b-instruct:free",
		label: "Mistral Small 3.2 24B",
		tagline: "Free large context model",
		context: "96K ctx",
		inputs: "Text",
		brand: "mistral",
		isReasoning: false,
	},
	// More Qwen Models
	{
		value: "qwen/qwen3-8b:free",
		label: "Qwen 3 8B",
		tagline: "Basic free Qwen model",
		context: "40K ctx",
		inputs: "Text",
		brand: "qwen",
		isReasoning: true,
	},
	{
		value: "qwen/qwen3-14b:free",
		label: "Qwen 3 14B",
		tagline: "Mid-range free Qwen model",
		context: "40K ctx",
		inputs: "Text",
		brand: "qwen",
		isReasoning: true,
	},
	{
		value: "qwen/qwen3-30b-a3b:free",
		label: "Qwen 3 30B A3B",
		tagline: "Larger free Qwen model",
		context: "40K ctx",
		inputs: "Text",
		brand: "qwen",
		isReasoning: true,
	},
	{
		value: "qwen/qwen3-32b:free",
		label: "Qwen 3 32B",
		tagline: "High-capacity free Qwen model",
		context: "40K ctx",
		inputs: "Text",
		brand: "qwen",
		isReasoning: true,
	},
	{
		value: "qwen/qwen3-coder:free",
		label: "Qwen 3 Coder (480B)",
		tagline: "Free coding-optimized model",
		context: "262K ctx",
		inputs: "Text",
		brand: "qwen",
		isReasoning: true,
	},
	// GLM Models
	{
		value: "thudm/glm-z1-32b:free",
		label: "GLM Z1 32B",
		tagline: "Large GLM-family free model",
		context: "32K ctx",
		inputs: "Text",
		brand: "thudm",
		isReasoning: true,
	},
	{
		value: "zhipu-ai/glm-4-air:free",
		label: "GLM 4 Air",
		tagline: "Zhipu free model",
		context: "128K ctx",
		inputs: "Text",
		brand: "zhipu",
		isReasoning: false,
	},
	// Microsoft Models
	{
		value: "microsoft/mai-ds-r1:free",
		label: "Microsoft MAI DS R1",
		tagline: "Microsoft free reasoning model",
		context: "163K ctx",
		inputs: "Text",
		brand: "microsoft",
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
	// Sarvam Models
	{
		value: "sarvamai/sarvam-m:free",
		label: "Sarvam M",
		tagline: "Smaller free model",
		context: "32K ctx",
		inputs: "Text",
		brand: "sarvam",
		isReasoning: false,
	},
	// More Google Models
	{
		value: "google/gemma-2-9b-it:free",
		label: "Gemma 2 9B IT",
		tagline: "Google free open model",
		context: "8K ctx",
		inputs: "Text",
		brand: "google",
		isReasoning: false,
	},
];

export const DEFAULT_MODEL = "openrouter/auto";
