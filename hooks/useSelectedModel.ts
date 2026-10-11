"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_MODEL } from "@/lib/constants";

const EVENT_NAME = "tryai:model-change";

function subscribe(callback: () => void) {
	window.addEventListener("storage", callback);
	window.addEventListener(EVENT_NAME, callback);
	return () => {
		window.removeEventListener("storage", callback);
		window.removeEventListener(EVENT_NAME, callback);
	};
}

function read(storageKey: string) {
	try {
		return localStorage.getItem(storageKey) ?? DEFAULT_MODEL[0].value;
	} catch {
		return DEFAULT_MODEL[0].value;
	}
}

export function useSelectedModel(storageKey = "tryai-model"): [string, (model: string) => void] {
	const model = useSyncExternalStore(
		subscribe,
		() => read(storageKey),
		() => DEFAULT_MODEL[0].value,
	);

	const setModel = useCallback(
		(next: string) => {
			try {
				localStorage.setItem(storageKey, next);
			} catch {
				return;
			}
			window.dispatchEvent(new Event(EVENT_NAME));
		},
		[storageKey],
	);

	return [model, setModel];
}
