"use client";

import * as React from "react";

const STORAGE_KEY = "openrouter-api-key";

type ApiKeyContextValue = {
	apiKey: string | null;
	setApiKey: (key: string) => void;
	clearApiKey: () => void;
	hasApiKey: boolean;
};

const ApiKeyContext = React.createContext<ApiKeyContextValue | null>(null);

function getStored(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(STORAGE_KEY);
}

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
	const [apiKey, setApiKeyState] = React.useState<string | null>(null);

	React.useEffect(() => {
		setApiKeyState(getStored());
	}, []);

	const setApiKey = React.useCallback((key: string) => {
		localStorage.setItem(STORAGE_KEY, key);
		setApiKeyState(key);
	}, []);

	const clearApiKey = React.useCallback(() => {
		localStorage.removeItem(STORAGE_KEY);
		setApiKeyState(null);
	}, []);

	const value: ApiKeyContextValue = React.useMemo(
		() => ({
			apiKey,
			setApiKey,
			clearApiKey,
			hasApiKey: Boolean(apiKey),
		}),
		[apiKey, setApiKey, clearApiKey],
	);

	return React.createElement(ApiKeyContext.Provider, { value }, children);
}

export function useApiKey(): ApiKeyContextValue {
	const ctx = React.useContext(ApiKeyContext);
	if (!ctx) throw new Error("useApiKey must be used within ApiKeyProvider");
	return ctx;
}

export function getStoredApiKey(): string | null {
	return getStored();
}
