import { createClient } from "@libsql/client/web";

if (!process.env.TURSO_DATABASE_URL) {
	throw new Error("TURSO_DATABASE_URL is not defined");
}

export const turso = createClient({
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

// Helper function to generate CUID-like IDs
export function generateId(): string {
	const timestamp = Date.now().toString(36);
	const randomStr = Math.random().toString(36).substring(2, 15);
	return `${timestamp}${randomStr}`;
}
