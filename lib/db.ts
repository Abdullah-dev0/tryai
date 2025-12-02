import { createClient } from "@libsql/client/web";

if (!process.env.TURSO_DATABASE_URL) {
	throw new Error("TURSO_DATABASE_URL is not defined");
}

export const turso = createClient({
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database tables
export async function initDB() {
	await turso.batch(
		[
			`CREATE TABLE IF NOT EXISTS conversations (
			id TEXT PRIMARY KEY,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`,
			`CREATE TABLE IF NOT EXISTS messages (
			id TEXT PRIMARY KEY,
			role TEXT NOT NULL,
			content TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			conversation_id TEXT NOT NULL,
			FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
		)`,
			`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`,
			`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`,
		],
		"write",
	);
}

// Helper function to generate CUID-like IDs
export function generateId(): string {
	const timestamp = Date.now().toString(36);
	const randomStr = Math.random().toString(36).substring(2, 15);
	return `${timestamp}${randomStr}`;
}
