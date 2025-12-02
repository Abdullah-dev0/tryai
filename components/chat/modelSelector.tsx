"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const models = [
	{ value: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash" },
	{ value: "google/gemini-flash-1.5:free", label: "Gemini Flash 1.5" },
	{ value: "google/gemini-pro-1.5:free", label: "Gemini Pro 1.5" },
	{ value: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B" },
	{ value: "meta-llama/llama-3.1-8b-instruct:free", label: "Llama 3.1 8B" },
	{ value: "meta-llama/llama-3.1-70b-instruct:free", label: "Llama 3.1 70B" },
	{ value: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B" },
	{ value: "mistralai/mixtral-8x7b-instruct:free", label: "Mixtral 8x7B" },
	{ value: "qwen/qwen-2.5-7b-instruct:free", label: "Qwen 2.5 7B" },
];

interface ModelSelectorProps {
	value: string;
	onValueChange: (value: string) => void;
}

export function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
	const [open, setOpen] = React.useState(false);
	const selectedModel = models.find((model) => model.value === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" className="gap-1 text-sm font-normal">
					{selectedModel?.label || "Select model"}
					<ChevronDown className="h-4 w-4 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-0" align="end">
				<Command>
					<CommandInput placeholder="Search models..." />
					<CommandList>
						<CommandEmpty>No model found.</CommandEmpty>
						<CommandGroup>
							{models.map((model) => (
								<CommandItem
									key={model.value}
									value={model.value}
									onSelect={(currentValue) => {
										onValueChange(currentValue);
										setOpen(false);
									}}>
									<Check className={cn("mr-2 h-4 w-4", value === model.value ? "opacity-100" : "opacity-0")} />
									{model.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
