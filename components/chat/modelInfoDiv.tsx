"use client";

import { Star, Eye, Brain, Wrench } from "lucide-react";
import type { ModelOption } from "@/lib/constants";
import {
	hasVision,
	hasToolCalling,
	formatContextLength,
	formatAddedOn,
	getProviderFromId,
} from "@/lib/utils";
import type { OpenRouterModelSummary } from "@/lib/types/openrouter";

interface ModelInfoDivProps {
	model: ModelOption;
	full: OpenRouterModelSummary | undefined;
}

export function ModelInfoDiv({ model, full }: ModelInfoDivProps) {
	return (
		<div className="w-96 max-h-[400px] overflow-y-auto rounded-lg p-4 text-left">
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h3 className="text-sm font-semibold tracking-tight">
							{full?.name ?? model.label}
						</h3>
						<Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
					</div>
					<p className="mt-1 text-xs text-muted-foreground">{model.tagline}</p>
				</div>
			</div>
			{full && (
				<>
					<p className="mt-3 text-xs leading-relaxed text-foreground/90">
						{full.description}
					</p>
					<div className="mt-3 flex flex-wrap gap-1.5">
						{hasVision(full.architecture) && (
							<span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs">
								<Eye className="h-3 w-3" /> Vision
							</span>
						)}
						{hasToolCalling(full.supported_parameters) && (
							<span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs">
								<Wrench className="h-3 w-3" /> Tools
							</span>
						)}
						{full.supported_parameters?.includes("reasoning") && (
							<span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs">
								<Brain className="h-3 w-3" /> Reasoning
							</span>
						)}
					</div>
					<dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
						<dt className="text-muted-foreground">Provider</dt>
						<dd className="font-medium">{getProviderFromId(full.id)}</dd>
						<dt className="text-muted-foreground">Context</dt>
						<dd className="font-medium">{formatContextLength(full.context_length)}</dd>
						<dt className="text-muted-foreground">Added on</dt>
						<dd className="font-medium">{formatAddedOn(full.created)}</dd>
						<dt className="text-muted-foreground">Pricing</dt>
						<dd className="font-medium">
							{full.pricing.prompt === "0" && full.pricing.completion === "0"
								? "Free"
								: `$${full.pricing.prompt}/in · $${full.pricing.completion}/out`}
						</dd>
						{(() => {
							const cutoff = (full as Record<string, unknown>).knowledge_cutoff;
							return cutoff ? (
								<>
									<dt className="text-muted-foreground">Knowledge cutoff</dt>
									<dd className="font-medium">{String(cutoff)}</dd>
								</>
							) : null;
						})()}
					</dl>
				</>
			)}
		</div>
	);
}
