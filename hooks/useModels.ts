"use client";

import { useEffect, useMemo, useState } from "react";
import { getModels, type ModelsActionResult } from "@/app/actions/modelActions";
import { DEFAULT_MODEL } from "@/lib/constants";
import { hasVision } from "@/lib/utils";

const cache = new Map<boolean, Promise<ModelsActionResult>>();

function loadModels(includePaid: boolean) {
	let promise = cache.get(includePaid);
	if (!promise) {
		promise = getModels(includePaid);
		promise.catch(() => cache.delete(includePaid));
		cache.set(includePaid, promise);
	}
	return promise;
}

export function useModels(includePaid: boolean) {
	const [result, setResult] = useState<{ includePaid: boolean; data: ModelsActionResult } | null>(null);

	useEffect(() => {
		let cancelled = false;
		loadModels(includePaid)
			.then((data) => {
				if (!cancelled) setResult({ includePaid, data });
			})
			.catch(() => {
				if (!cancelled) setResult({ includePaid, data: { options: [], models: [] } });
			});
		return () => {
			cancelled = true;
		};
	}, [includePaid]);

	const loading = result?.includePaid !== includePaid;
	const options = useMemo(
		() => [...DEFAULT_MODEL, ...(result?.data.options ?? []).filter((o) => o.value !== DEFAULT_MODEL[0].value)],
		[result],
	);
	const models = useMemo(() => result?.data.models ?? [], [result]);

	return { options, models, loading };
}

export function useActiveModel(selected: string, includePaid: boolean) {
	const { options, models, loading } = useModels(includePaid);
	const known = loading || options.some((option) => option.value === selected);
	const activeModel = known ? selected : DEFAULT_MODEL[0].value;
	const info = models.find((m) => m.id === activeModel);
	return { activeModel, supportsImages: hasVision(info?.architecture) };
}
