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

export interface ModelOption {
	value: string;
	label: string;
	tagline: string;
	context: string;
	inputs: string;
}

export const MODELS: ModelOption[] = [
	{
		value: "meta-llama/llama-3.3-70b-instruct:free",
		label: "Llama 3.3 70B",
		tagline: "Meta's powerful instruction-following model",
		context: "128K ctx",
		inputs: "Text",
	},
	{
		value: "google/gemma-3-27b-it:free",
		label: "Gemma 3 27B",
		tagline: "Google's efficient open model",
		context: "96K ctx",
		inputs: "Text",
	},
	{
		value: "deepseek/deepseek-chat-v3-0324:free",
		label: "DeepSeek V3",
		tagline: "Strong reasoning and coding capabilities",
		context: "64K ctx",
		inputs: "Text",
	},
	{
		value: "mistralai/mistral-small-3.1-24b-instruct:free",
		label: "Mistral Small 3.1",
		tagline: "Fast and efficient for everyday tasks",
		context: "32K ctx",
		inputs: "Text",
	},
	{
		value: "qwen/qwen3-32b:free",
		label: "Qwen 3 32B",
		tagline: "Alibaba's multilingual reasoning model",
		context: "32K ctx",
		inputs: "Text",
	},
	{
		value: "microsoft/phi-4:free",
		label: "Phi 4",
		tagline: "Microsoft's compact reasoning model",
		context: "16K ctx",
		inputs: "Text",
	},
	{
		value: "arcee-ai/trinity-mini:free",
		label: "Trinity Mini",
		tagline: "Arcee's compact reasoning model",
		context: "16K ctx",
		inputs: "Text",
	},
];

// Default model to use - Llama 3.3 is most reliable
export const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
