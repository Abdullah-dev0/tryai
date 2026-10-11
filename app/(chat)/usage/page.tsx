import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSession } from "@/lib/data/auth";
import { getUsageSummary } from "@/lib/data/usage";
import { DAILY_TOKEN_LIMIT, REQUESTS_PER_MINUTE } from "@/lib/limits";

const DAY_COUNT = 14;

function formatDay(date: string) {
	return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

function formatCost(cost: number) {
	return cost === 0 ? "$0" : `$${cost.toFixed(cost < 0.01 ? 4 : 2)}`;
}

export default function UsagePage() {
	return (
		<Suspense fallback={<UsageSkeleton />}>
			<UsageContent />
		</Suspense>
	);
}

function UsageSkeleton() {
	return (
		<div role="status" aria-label="Loading usage" className="h-full overflow-y-auto bg-background">
			<div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
				<Skeleton className="h-8 w-32 rounded-lg" />
				<Skeleton className="h-56 w-full rounded-[20px]" />
				<Skeleton className="h-28 w-full rounded-[20px]" />
				<Skeleton className="h-64 w-full rounded-[20px]" />
			</div>
		</div>
	);
}

async function UsageContent() {
	const session = await getSession();
	const usage = await getUsageSummary(session.user.id, DAY_COUNT);
	const maxTokens = Math.max(...usage.days.map((day) => day.tokens), 1);
	const quotaPercent = Math.min(100, Math.round((usage.tokensToday / DAILY_TOKEN_LIMIT) * 100));
	const stats = [
		{ label: `Tokens, last ${DAY_COUNT} days`, value: usage.totals.tokens.toLocaleString() },
		{ label: `Requests, last ${DAY_COUNT} days`, value: usage.totals.requests.toLocaleString() },
		{ label: `Cost, last ${DAY_COUNT} days`, value: formatCost(usage.totals.cost) },
	];

	return (
		<div className="h-full overflow-y-auto bg-background">
			<div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
				<div>
					<h1 className="font-display text-[26px] font-semibold tracking-tight text-foreground">Usage</h1>
					<p className="mt-1 text-sm text-muted-foreground">Days are counted in UTC.</p>
				</div>

				<section className="rounded-[20px] border bg-card p-6">
					<p className="font-mono text-xs text-muted-foreground">free tokens used today</p>
					<div className="mt-3 flex flex-wrap items-baseline gap-3">
						<p className="font-display text-[clamp(56px,10vw,112px)] font-bold leading-[0.9] tracking-[-0.05em] tabular-nums">
							{usage.tokensToday.toLocaleString()}
						</p>
						<p className="text-lg text-muted-foreground">of {DAILY_TOKEN_LIMIT.toLocaleString()}</p>
					</div>
					<div
						role="progressbar"
						aria-label="Free tokens used today"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={quotaPercent}
						className="mt-5 h-2 overflow-hidden rounded-full bg-border">
						<div className="h-full rounded-full bg-chart-1" style={{ width: `${quotaPercent}%` }} />
					</div>
					<p className="mt-3 text-xs text-muted-foreground">
						Without your own OpenRouter key you can use free models, up to {DAILY_TOKEN_LIMIT.toLocaleString()}{" "}
						tokens a day and {REQUESTS_PER_MINUTE} requests a minute. Requests on your own key have no limit here.
					</p>
				</section>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{stats.map((stat) => (
						<div key={stat.label} className="rounded-[20px] border bg-card p-6">
							<p className="text-xs text-muted-foreground">{stat.label}</p>
							<p className="mt-2 font-display text-4xl font-semibold tracking-tight tabular-nums text-foreground">{stat.value}</p>
						</div>
					))}
				</div>

				<section className="rounded-[20px] border bg-card p-6">
					<h2 className="font-display text-[22px] font-semibold tracking-tight text-foreground">Tokens per day</h2>
					<p className="mt-1 text-xs text-muted-foreground">Peak day: {maxTokens.toLocaleString()} tokens</p>
					<div className="mt-4 flex h-40 items-end gap-0.5 border-b border-border">
						{usage.days.map((day) => (
							<Tooltip key={day.date}>
								<TooltipTrigger asChild>
									<div
										tabIndex={0}
										aria-label={`${formatDay(day.date)}: ${day.tokens.toLocaleString()} tokens, ${day.requests} requests`}
										className="group flex h-full flex-1 items-end justify-center outline-none">
										<div
											className="w-full max-w-6 rounded-t bg-chart-1 opacity-85 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
											style={{ height: day.tokens > 0 ? `max(2px, ${(day.tokens / maxTokens) * 100}%)` : 0 }}
										/>
									</div>
								</TooltipTrigger>
								<TooltipContent side="top">
									<p className="font-medium">{formatDay(day.date)}</p>
									<p>
										{day.tokens.toLocaleString()} tokens · {day.requests} requests
									</p>
								</TooltipContent>
							</Tooltip>
						))}
					</div>
					<div className="mt-2 flex justify-between text-xs text-muted-foreground">
						<span>{formatDay(usage.days[0].date)}</span>
						<span>{formatDay(usage.days[usage.days.length - 1].date)}</span>
					</div>
				</section>

				<section className="rounded-[20px] border bg-card p-6">
					<h2 className="font-display text-[22px] font-semibold tracking-tight text-foreground">By model</h2>
					{usage.models.length === 0 ? (
						<p className="mt-3 text-sm text-muted-foreground">No usage yet.</p>
					) : (
						<table className="mt-3 w-full text-sm">
							<thead>
								<tr className="border-b text-left text-xs text-muted-foreground">
									<th className="py-2 font-medium">Model</th>
									<th className="py-2 pl-4 text-right font-medium">Requests</th>
									<th className="py-2 pl-4 text-right font-medium">Tokens</th>
									<th className="py-2 pl-4 text-right font-medium">Cost</th>
								</tr>
							</thead>
							<tbody>
								{usage.models.map((row) => (
									<tr key={row.model} className="border-b border-border/50 last:border-0">
										<td className="w-full max-w-0 truncate py-2 pr-4 font-mono text-[13px] text-foreground">{row.model}</td>
										<td className="py-2 pl-4 text-right tabular-nums text-muted-foreground">
											{row.requests.toLocaleString()}
										</td>
										<td className="py-2 pl-4 text-right tabular-nums text-muted-foreground">
											{row.tokens.toLocaleString()}
										</td>
										<td className="py-2 pl-4 text-right tabular-nums text-muted-foreground">{formatCost(row.cost)}</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</section>
			</div>
		</div>
	);
}
