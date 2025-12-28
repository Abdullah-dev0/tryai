"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "openrouter-api-key";

function getInitialValue(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(STORAGE_KEY);
}

export function useApiKey() {
	const [apiKey, setApiKeyState] = useState<string | null>(getInitialValue);

	const setApiKey = useCallback((key: string) => {
		localStorage.setItem(STORAGE_KEY, key);
		setApiKeyState(key);
	}, []);

	const clearApiKey = useCallback(() => {
		localStorage.removeItem(STORAGE_KEY);
		setApiKeyState(null);
	}, []);

	return {
		apiKey,
		setApiKey,
		clearApiKey,
		hasApiKey: Boolean(apiKey),
	};
}
