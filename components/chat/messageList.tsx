"use client";

import type { ChatMessage, ChatStatus } from "@/lib/types";
import { cn, shortModelName } from "@/lib/utils";
import { Brain, Check, Copy, Globe, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

interface MessageListProps {
	messages: ChatMessage[];
	status: ChatStatus;
	onRegenerate?: () => void;
}

function StreamingIndicator() {
	return (
		<div className="flex items-center gap-2 animate-in fade-in-0 duration-300">
			<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
			<span className="text-sm text-muted-foreground">Thinking...</span>
		</div>
	);
}

interface MessagePartRendererProps {
	part: ChatMessage["parts"][number];
}

function MessagePartRenderer({ part }: MessagePartRendererProps) {
	switch (part.type) {
		case "reasoning":
			return (
				<details className="group">
					<summary className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
						<Brain className="h-3 w-3" />
						<span>View reasoning</span>
					</summary>
					<pre className="text-xs bg-card border p-3 rounded-xl overflow-x-auto whitespace-pre-wrap">{part.text}</pre>
				</details>
			);
		case "text":
			return <Streamdown>{part.text}</Streamdown>;
		case "file":
			if (!part.mediaType.startsWith("image/")) return null;
			return (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={part.url} alt={part.filename ?? "Attached image"} className="max-h-64 rounded-xl object-contain" />
			);
		default:
			return null;
	}
}

function hostname(url: string) {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}

function MessageSources({ message }: { message: ChatMessage }) {
	const sources = message.parts.filter((part) => part.type === "source-url");
	if (sources.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<Globe className="h-3 w-3 text-muted-foreground" />
			{sources.map((source) => (
				<a
					key={source.sourceId}
					href={source.url}
					target="_blank"
					rel="noopener noreferrer"
					title={source.title ?? source.url}
					className="max-w-48 truncate rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
					{hostname(source.url)}
				</a>
			))}
		</div>
	);
}

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Could not copy to clipboard");
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			title="Copy"
			aria-label="Copy message"
			className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
			{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
		</button>
	);
}

function messageDetails(message: ChatMessage) {
	const { model, tokens, durationMs } = message.metadata ?? {};
	return [
		model ? shortModelName(model) : null,
		tokens ? `${tokens.toLocaleString()} tokens` : null,
		durationMs ? `${(durationMs / 1000).toFixed(1)}s` : null,
	].filter(Boolean);
}

export function MessageList({ messages, status, onRegenerate }: MessageListProps) {
	const lastMessage = messages.at(-1);
	const isLastMessageEmpty = lastMessage?.role === "assistant" && !lastMessage.parts?.length;
	const isBusy = status === "submitted" || status === "streaming";

	const displayMessages = isLastMessageEmpty ? messages.slice(0, -1) : messages;
	const showLoading = status === "submitted" || (status === "streaming" && isLastMessageEmpty);

	return (
		<div className="flex flex-col gap-6">
			{displayMessages.map((message) => {
				const isUser = message.role === "user";
				const isLast = message.id === lastMessage?.id;
				const isStreaming = isLast && isBusy;
				const text = message.parts
					.filter((part) => part.type === "text")
					.map((part) => part.text)
					.join("");
				const details = isUser ? [] : messageDetails(message);

				return (
					<div
						key={message.id}
						className={cn(
							"group/message flex min-w-0 flex-col gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
							isUser && "items-end",
						)}>
						<div
							className={cn(
								"min-w-0 space-y-2 text-[15px] leading-relaxed",
								isUser ? "max-w-[80%] rounded-[18px] rounded-br-sm bg-secondary px-4 py-3" : "w-full",
							)}>
							{message.parts?.map((part, index) => (
								<MessagePartRenderer key={index} part={part} />
							))}
						</div>
						{!isUser && <MessageSources message={message} />}
						{(isUser || !isStreaming) && (
							<div
								className={cn(
									"flex items-center gap-1 text-xs text-muted-foreground",
									isUser && "opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 transition-opacity",
								)}>
								{details.length > 0 && <span className="pr-1 font-mono">{details.join(" · ")}</span>}
								{text && <CopyButton text={text} />}
								{!isUser && isLast && onRegenerate && (
									<button
										type="button"
										onClick={onRegenerate}
										title="Regenerate"
										aria-label="Regenerate response"
										className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-accent hover:text-foreground transition-colors">
										<RotateCcw className="h-3.5 w-3.5" />
									</button>
								)}
							</div>
						)}
					</div>
				);
			})}
			{showLoading && <StreamingIndicator />}
		</div>
	);
}
