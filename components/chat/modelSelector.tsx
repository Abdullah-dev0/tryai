"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MODELS } from "@/lib/constants";


interface ModelSelectorProps {
	value: string;
	onValueChange: (value: string) => void;
	className?: string;
}

export function ModelSelector({ value, onValueChange, className }: ModelSelectorProps) {
	const [open, setOpen] = React.useState(false);
	const selectedModel = MODELS.find((model) => model.value === value);

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
							{MODELS.map((model) => (
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
