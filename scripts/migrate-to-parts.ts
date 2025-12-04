/**
 * Migration script to convert old message format (content + reasoning) to new format (parts JSON)
 *
 * Run with: npx tsx scripts/migrate-to-parts.ts
 *
 * WARNING: Back up your database before running this!
 */

import { config } from "dotenv";
import { createClient } from "@libsql/client/web";

// Load environment variables from .env file
config();

const turso = createClient({
	url: process.env.TURSO_DATABASE_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
	// eslint-disable-next-line no-console
	console.log("Starting migration...");

	// 1. Check if old schema exists (has 'content' column)
	const tableInfo = await turso.execute("PRAGMA table_info(messages)");
	const hasContent = tableInfo.rows.some((row) => row.name === "content");
	const hasParts = tableInfo.rows.some((row) => row.name === "parts");

	if (hasParts && !hasContent) {
		// eslint-disable-next-line no-console
		console.log("Already migrated! Nothing to do.");
		return;
	}

	if (!hasContent) {
		// eslint-disable-next-line no-console
		console.log("No 'content' column found. Creating fresh schema...");
		await turso.execute(`
			CREATE TABLE IF NOT EXISTS messages (
				id TEXT PRIMARY KEY,
				role TEXT NOT NULL,
				parts TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				conversation_id TEXT NOT NULL,
				FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
			)
		`);
		// eslint-disable-next-line no-console
		console.log("Fresh schema created!");
		return;
	}

	// eslint-disable-next-line no-console
	console.log("Found old schema. Migrating data...");

	// 2. We need to recreate the table since SQLite doesn't support DROP COLUMN easily
	// First, create a new table with the correct schema
	await turso.execute(`
		CREATE TABLE IF NOT EXISTS messages_new (
			id TEXT PRIMARY KEY,
			role TEXT NOT NULL,
			parts TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			conversation_id TEXT NOT NULL,
			FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
		)
	`);

	// 3. Migrate data: convert content + reasoning to parts JSON
	const messages = await turso.execute(
		"SELECT id, role, content, reasoning, created_at, conversation_id FROM messages",
	);
	// eslint-disable-next-line no-console
	console.log(`Found ${messages.rows.length} messages to migrate.`);

	for (const msg of messages.rows) {
		const parts: { type: string; text: string }[] = [];

		// Add reasoning first if exists (for assistant messages)
		if (msg.role === "assistant" && msg.reasoning) {
			parts.push({ type: "reasoning", text: msg.reasoning as string });
		}

		// Add text content
		if (msg.content) {
			parts.push({ type: "text", text: msg.content as string });
		}

		await turso.execute({
			sql: "INSERT INTO messages_new (id, role, parts, created_at, conversation_id) VALUES (?, ?, ?, ?, ?)",
			args: [msg.id, msg.role, JSON.stringify(parts), msg.created_at, msg.conversation_id],
		});
	}

	// 4. Drop old table and rename new one
	await turso.execute("DROP TABLE messages");
	await turso.execute("ALTER TABLE messages_new RENAME TO messages");

	// 5. Recreate indexes
	await turso.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)");
	await turso.execute("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)");

	// eslint-disable-next-line no-console
	console.log("Migration complete!");
}

migrate().catch(console.error);
