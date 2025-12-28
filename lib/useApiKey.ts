"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "openrouter-api-key";

let listeners: Array<() => void> = [];

function emitChange() {
	for (const listener of listeners) {
		listener();
	}
}

function subscribe(callback: () => void): () => void {
	listeners = [...listeners, callback];
	return () => {
		listeners = listeners.filter((l) => l !== callback);
	};
}

function getSnapshot(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
	return null;
}

export function useApiKey() {
	const apiKey = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	const setApiKey = useCallback((key: string) => {
		localStorage.setItem(STORAGE_KEY, key);
		emitChange();
	}, []);

	const clearApiKey = useCallback(() => {
		localStorage.removeItem(STORAGE_KEY);
		emitChange();
	}, []);

	return {
		apiKey,
		setApiKey,
		clearApiKey,
		hasApiKey: Boolean(apiKey),
	};
}

export function getStoredApiKey(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(STORAGE_KEY);
}
