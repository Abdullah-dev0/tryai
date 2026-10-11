import { z } from "zod";
import { AUTO_MODEL, MAX_IMAGE_DATA_URL_LENGTH, MAX_IMAGES_PER_MESSAGE, MAX_MESSAGE_CHARS } from "@/lib/limits";
import type { ChatMessage } from "@/lib/types";

const chatOptionsSchema = z.object({
	model: z.preprocess(
		(value) => (typeof value === "string" && value.trim()) || AUTO_MODEL,
		z.string().regex(/^[\w./:-]{1,100}$/),
	),
	apiKey: z.string().trim().min(1).optional().catch(undefined),
	webSearch: z.boolean().catch(false),
});

export type ChatOptions = z.infer<typeof chatOptionsSchema>;

const textPartSchema = z.object({ type: z.literal("text"), text: z.string() });

const imagePartSchema = z.object({
	type: z.literal("file"),
	mediaType: z.string().startsWith("image/"),
	url: z.string().startsWith("data:image/").max(MAX_IMAGE_DATA_URL_LENGTH),
});

const userMessageSchema = z
	.object({
		id: z.string().min(1).max(64),
		role: z.literal("user"),
		parts: z.array(z.union([textPartSchema, imagePartSchema])),
	})
	.refine((message) => {
		const chars = messageText(message).length;
		const images = message.parts.filter((part) => part.type === "file").length;
		return chars <= MAX_MESSAGE_CHARS && images <= MAX_IMAGES_PER_MESSAGE && chars + images > 0;
	});

const assistantMessageSchema = z
	.object({
		id: z.string(),
		role: z.literal("assistant"),
		parts: z.array(z.looseObject({ type: z.string() })),
	})
	.transform((message) => ({
		id: message.id,
		role: message.role,
		parts: [{ type: "text" as const, text: messageText(message).slice(0, MAX_MESSAGE_CHARS) }],
	}))
	.refine((message) => message.parts[0].text.length > 0);

export function parseChatOptions(body: unknown): ChatOptions | null {
	return chatOptionsSchema.safeParse(body).data ?? null;
}

export function parseUserMessage(raw: unknown): ChatMessage | null {
	return userMessageSchema.safeParse(raw).data ?? null;
}

export function parseMessage(raw: unknown): ChatMessage | null {
	return parseUserMessage(raw) ?? assistantMessageSchema.safeParse(raw).data ?? null;
}

export function messageText(message: { parts: { type: string; text?: unknown }[] }) {
	return message.parts
		.filter((part) => part.type === "text" && typeof part.text === "string")
		.map((part) => part.text)
		.join("");
}

export function hasImages(message: ChatMessage) {
	return message.parts.some((part) => part.type === "file");
}
