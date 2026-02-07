"use client";

import * as React from "react";
import {
	Search,
	SlidersHorizontal,
	ChevronUp,
	Star,
	Eye,
	Brain,
	FileText,
	Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ModelInfoDiv } from "@/components/chat/modelInfoDiv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getModels } from "@/app/actions/modelActions";
import {
	BRAND_COLORS,
	BRAND_LABELS,
	DEFAULT_MODEL,
	ModelBrand,
	type ModelOption,
} from "@/lib/constants";
import { hasVision } from "@/lib/utils";
import type { OpenRouterModelSummary } from "@/lib/types/openrouter";

function BrandIcon({ brand }: { brand: ModelBrand }) {
	return (
		<div
			className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-semibold text-white"
			style={{ backgroundColor: BRAND_COLORS[brand] }}
		>
			{BRAND_LABELS[brand]}
		</div>
	);
}

interface ModelSelectorProps {
	value: string;
	onValueChange: (value: string) => void;
	className?: string;
}

export function ModelSelector({ value, onValueChange, className }: ModelSelectorProps) {
	const [open, setOpen] = React.useState(false);
	const [options, setOptions] = React.useState<ModelOption[]>(DEFAULT_MODEL);
	const [fullModels, setFullModels] = React.useState<OpenRouterModelSummary[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [search, setSearch] = React.useState("");

	React.useEffect(() => {
		getModels()
			.then((data) => {
				if (data.options?.length) setOptions(data.options);
				if (Array.isArray(data.models)) setFullModels(data.models);
			})
			.catch(() => setOptions(DEFAULT_MODEL))
			.finally(() => setLoading(false));
	}, []);

	const selectedOption = options.find((m) => m.value === value) ?? DEFAULT_MODEL[0];

	const filtered = React.useMemo(() => {
		let list = options;
		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter(
				(m) =>
					m.label.toLowerCase().includes(q) ||
					m.value.toLowerCase().includes(q) ||
					m.tagline.toLowerCase().includes(q),
			);
		}
		return list;
	}, [options, search]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"h-9 gap-2 rounded-lg px-3 text-sm font-medium",
						className,
					)}
				>
					{selectedOption && <BrandIcon brand={selectedOption.brand} />}
					<span className="truncate">
						{loading ? "Loading…" : selectedOption?.label || "Select model"}
					</span>
					<ChevronUp className="h-4 w-4 shrink-0 opacity-70" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				sideOffset={8}
				className="flex w-[min(95vw,560px)] overflow-hidden rounded-xl border bg-popover p-0 text-popover-foreground shadow-xl"
			>
				<div className="flex w-full min-w-0 flex-col">
					{/* Search bar */}
					<div className="flex items-center gap-2 border-b border-border px-4 py-2">
						<Search className="h-4 w-4 shrink-0 text-muted-foreground" />
						<Input
							placeholder="Search models..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-9 flex-1 border-0 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
						/>
						<button
							type="button"
							className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
							aria-label="Filter"
						>
							<SlidersHorizontal className="h-4 w-4" />
						</button>
					</div>

					{/* Main: model list */}
					<div className="flex h-[min(420px,75vh)] w-full min-w-0">
						<div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
							<ScrollArea className="h-full w-full">
								<div className="p-1">
									{filtered.length === 0 ? (
										<div className="py-8 text-center text-sm text-muted-foreground">
											No model found.
										</div>
									) : (
										filtered.map((model) => {
											const isSelected = value === model.value;
											const full = fullModels.find((m) => m.id === model.value);
											const vision = hasVision(full?.architecture);
											const isReasoning =
												model.isReasoning || full?.supported_parameters?.includes("reasoning");

											return (
												<div
													key={model.value}
													role="button"
													tabIndex={0}
													onClick={() => {
														onValueChange(model.value);
														setOpen(false);
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.preventDefault();
															onValueChange(model.value);
															setOpen(false);
														}
													}}
													className={cn(
														"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer",
														isSelected && "bg-muted",
														!isSelected && "hover:bg-muted/60",
													)}
												>
													<BrandIcon brand={model.brand} />
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-1.5">
															<span className={cn(
																"truncate text-sm",
																isSelected ? "font-semibold" : "font-medium",
															)}>
																{model.label}
															</span>
															<Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
														</div>
														<p className="mt-0.5 truncate text-xs text-muted-foreground">
															{model.tagline.length > 45
																? model.tagline.slice(0, 45) + "…"
																: model.tagline}
														</p>
													</div>
													<div className="flex shrink-0 items-center gap-1">
														{vision && (
															<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
																<Eye className="h-3.5 w-3.5" />
															</div>
														)}
														{isReasoning && (
															<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-500">
																<Brain className="h-3.5 w-3.5" />
															</div>
														)}
														<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
															<FileText className="h-3.5 w-3.5" />
														</div>
														<Tooltip>
															<TooltipTrigger asChild>
																<span
																	role="button"
																	tabIndex={0}
																	onClick={(e) => e.stopPropagation()}
																	onKeyDown={(e) => e.stopPropagation()}
																	className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
																	aria-label="Model details"
																>
																	<Info className="h-3.5 w-3.5" />
																</span>
															</TooltipTrigger>
															<TooltipContent
																side="right"
																align="end"
																sideOffset={16}
																className="max-w-md p-0 border-0 bg-popover text-popover-foreground shadow-lg [&>svg]:fill-popover [&>svg]:stroke-popover"
															>
																<ModelInfoDiv model={model} full={full} />
															</TooltipContent>
														</Tooltip>
													</div>
												</div>
											);
										})
									)}
								</div>
							</ScrollArea>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
