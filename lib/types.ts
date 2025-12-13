import type { UIMessage } from "ai";

// Define typed UIMessage for type-safe metadata access
export type MessageMetadata = { tokens: number };
export type ChatMessage = UIMessage<MessageMetadata>;
