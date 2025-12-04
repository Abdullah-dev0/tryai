"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ModelOption = {
	value: string;
	label: string;
	tagline: string;
	context: string;
	inputs: string;
};

const models: ModelOption[] = [
	{
		value: "amazon/nova-2-lite-v1:free",
		label: "Amazon Nova 2 Lite",
		tagline: "Fast multimodal reasoning for everyday prompts",
		context: "1M ctx",
		inputs: "Text · Image · Video",
	},
	{
		value: "arcee-ai/trinity-mini:free",
		label: "Arcee Trinity Mini",
		tagline: "Equilibrium MoE model with strong long-context reasoning",
		context: "131K ctx",
		inputs: "Text",
	},
	{
		value: "allenai/olmo-3-32b-think:free",
		label: "OLMo 3 32B Think",
		tagline: "Open deep-reasoning model tuned for thoughtful chains",
		context: "65K ctx",
		inputs: "Text",
	},
	{
		value: "google/gemini-2.0-flash-exp:free",
		label: "Gemini 2.0 Flash",
		tagline: "Google's lightweight multimodal Flash preview",
		context: "1M ctx",
		inputs: "Text · Image",
	},
	{
		value: "x-ai/grok-4.1-fast:free",
		label: "Grok 4.1 Fast",
		tagline: "xAI's agentic fast model with optional reasoning",
		context: "2M ctx",
		inputs: "Text · Image",
	},
	{
		value: "kwaipilot/kat-coder-pro:free",
		label: "KAT Coder Pro",
		tagline: "High-accuracy agentic coding model (SWE-Bench 73%)",
		context: "256K ctx",
		inputs: "Text",
	},
	{
		value: "alibaba/tongyi-deepresearch-30b-a3b:free",
		label: "Tongyi DeepResearch",
		tagline: "Agentic deep-research MoE optimized for browsing",
		context: "128K ctx",
		inputs: "Text",
	},
	{
		value: "meituan/longcat-flash-chat:free",
		label: "LongCat Flash Chat",
		tagline: "560B MoE conversationalist with tool-use strength",
		context: "128K ctx",
		inputs: "Text",
	},
	{
		value: "nvidia/nemotron-nano-9b-v2:free",
		label: "Nemotron Nano 9B",
		tagline: "Reasoning-first 9B model emitting optional thoughts",
		context: "128K ctx",
		inputs: "Text",
	},
	{
		value: "openai/gpt-oss-20b:free",
		label: "GPT-OSS 20B",
		tagline: "Open-weight 21B model compatible with GPT Harmony format",
		context: "131K ctx",
		inputs: "Text",
	},
	{
		value: "z-ai/glm-4.5-air:free",
		label: "GLM 4.5 Air",
		tagline: "Z.AI's efficient chat model",
		context: "131K ctx",
		inputs: "Text",
	},
];

interface ModelSelectorProps {
	value: string;
	onValueChange: (value: string) => void;
	className?: string;
}

export function ModelSelector({ value, onValueChange, className }: ModelSelectorProps) {
	const [open, setOpen] = React.useState(false);
	const selectedModel = models.find((model) => model.value === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50",
						className,
					)}>
					<span className="truncate">{selectedModel?.label || "Select model"}</span>
					<ChevronDown className="h-3 w-3 opacity-60" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[360px] p-0" align="start" sideOffset={8}>
				<Command>
					<CommandInput placeholder="Search models..." className="h-10" />
					<CommandList className="max-h-[300px]">
						<CommandEmpty>No model found.</CommandEmpty>
						<CommandGroup>
							{models.map((model) => (
								<CommandItem
									key={model.value}
									value={model.value}
									onSelect={(currentValue) => {
										onValueChange(currentValue);
										setOpen(false);
									}}
									className="flex items-start gap-3 py-3 px-3">
									<Check
										className={cn("mt-0.5 h-4 w-4 shrink-0", value === model.value ? "opacity-100" : "opacity-0")}
									/>
									<div className="flex flex-col gap-0.5 min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">{model.label}</span>
											<span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
												{model.context}
											</span>
										</div>
										<span className="text-xs text-muted-foreground truncate">{model.tagline}</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
