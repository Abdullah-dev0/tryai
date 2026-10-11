import { generateId } from "ai";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, usageEvents } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfUtcDay(now = Date.now()) {
	const d = new Date(now);
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export async function getQuotaStatus(userId: string) {
	const now = Date.now();
	const dayStart = startOfUtcDay(now);
	const minuteStart = now - 60_000;

	const [row] = await db
		.select({
			tokensToday: sql<number>`coalesce(sum(case when ${usageEvents.createdAt} >= ${dayStart} then ${usageEvents.totalTokens} else 0 end), 0)`,
			requestsLastMinute: sql<number>`coalesce(sum(case when ${usageEvents.createdAt} >= ${minuteStart} then 1 else 0 end), 0)`,
		})
		.from(usageEvents)
		.where(
			and(
				eq(usageEvents.userId, userId),
				eq(usageEvents.ownKey, false),
				gte(usageEvents.createdAt, Math.min(dayStart, minuteStart)),
			),
		);

	return {
		tokensToday: Number(row?.tokensToday ?? 0),
		requestsLastMinute: Number(row?.requestsLastMinute ?? 0),
	};
}

export async function reserveUsage({ userId, model, ownKey }: { userId: string; model: string; ownKey: boolean }) {
	const id = generateId();
	await db.insert(usageEvents).values({ id, userId, model, ownKey, createdAt: Date.now() });
	return id;
}

export async function settleUsage(id: string, usage: { model: string; totalTokens: number; cost: number }) {
	await db
		.update(usageEvents)
		.set({ model: usage.model, totalTokens: usage.totalTokens, cost: usage.cost })
		.where(eq(usageEvents.id, id));
}

export interface UsageSummary {
	tokensToday: number;
	days: { date: string; tokens: number; requests: number }[];
	models: { model: string; tokens: number; requests: number; cost: number }[];
	totals: { tokens: number; requests: number; cost: number };
}

export async function getUsageSummary(userId: string, dayCount = 14): Promise<UsageSummary> {
	const todayStart = startOfUtcDay();
	const since = todayStart - (dayCount - 1) * DAY_MS;
	const scope = and(eq(usageEvents.userId, userId), gte(usageEvents.createdAt, since));
	const day = sql<string>`strftime('%Y-%m-%d', ${usageEvents.createdAt} / 1000, 'unixepoch')`;
	const tokens = sql<number>`coalesce(sum(${usageEvents.totalTokens}), 0)`;
	const requests = sql<number>`count(*)`;
	const cost = sql<number>`coalesce(sum(${usageEvents.cost}), 0)`;

	const [quota, dayRows, modelRows] = await Promise.all([
		getQuotaStatus(userId),
		db.select({ date: day, tokens, requests }).from(usageEvents).where(scope).groupBy(day),
		db
			.select({ model: usageEvents.model, tokens, requests, cost })
			.from(usageEvents)
			.where(scope)
			.groupBy(usageEvents.model)
			.orderBy(desc(tokens)),
	]);

	const byDate = new Map(dayRows.map((row) => [row.date, row]));
	const days = Array.from({ length: dayCount }, (_, i) => {
		const date = new Date(since + i * DAY_MS).toISOString().slice(0, 10);
		const row = byDate.get(date);
		return { date, tokens: Number(row?.tokens ?? 0), requests: Number(row?.requests ?? 0) };
	});

	const models = modelRows.map((row) => ({
		model: row.model,
		tokens: Number(row.tokens),
		requests: Number(row.requests),
		cost: Number(row.cost),
	}));

	return {
		tokensToday: quota.tokensToday,
		days,
		models,
		totals: models.reduce(
			(acc, row) => ({
				tokens: acc.tokens + row.tokens,
				requests: acc.requests + row.requests,
				cost: acc.cost + row.cost,
			}),
			{ tokens: 0, requests: 0, cost: 0 },
		),
	};
}
