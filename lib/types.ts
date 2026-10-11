import type { UIMessage } from "ai";

// Define typed UIMessage for type-safe metadata access
export interface MessageMetadata {
	tokens?: number;
	model?: string;
	cost?: number;
	ttftMs?: number;
	durationMs?: number;
}
export type ChatMessage = UIMessage<MessageMetadata>;
export type ChatStatus = "submitted" | "streaming" | "ready" | "error";
export interface Conversation {
	id: string;
	title: string | null;
	pinned: boolean;
	isPublic: boolean;
	createdAt: Date;
	updatedAt: Date;
	lastMessage: string | null;
}
export interface ConversationSearchResult {
	conversationId: string;
	snippet: string;
}
