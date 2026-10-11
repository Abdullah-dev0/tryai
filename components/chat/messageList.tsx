"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ChatMessage, ChatStatus } from "@/lib/types";
import { cn, shortModelName } from "@/lib/utils";
import { Bot, Brain, Check, ChevronRight, Copy, Globe, Loader2, RotateCcw, User } from "lucide-react";
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
		<div className="flex gap-4 justify-start animate-in fade-in-0 duration-300">
			<Avatar className="w-8 h-8 mt-1 shrink-0">
				<AvatarFallback className="bg-primary/10">
					<Bot size={16} className="text-primary" />
				</AvatarFallback>
			</Avatar>
			<div className="flex items-center gap-2 px-4 py-3">
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				<span className="text-sm text-muted-foreground">Thinking...</span>
			</div>
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
					<summary className="flex items-center gap-2 cursor-pointer list-none text-xs leading-5 text-muted-foreground hover:text-foreground transition-colors [&::-webkit-details-marker]:hidden">
						<Brain
							className={cn(
								"h-3 w-3 transition-transform duration-200 group-hover:scale-110 group-open:text-primary",
								part.state === "streaming" && "animate-pulse",
							)}
						/>
						<span>View reasoning</span>
						<ChevronRight className="h-3 w-3 transition-transform duration-200 group-open:rotate-90" />
					</summary>
					<pre className="mt-2 text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap animate-in fade-in-0 slide-in-from-top-1 duration-200">{part.text}</pre>
				</details>
			);
		case "text":
			if (!part.text.trim()) return null;
			return <Streamdown>{part.text}</Streamdown>;
		case "file":
			if (!part.mediaType.startsWith("image/")) return null;
			return (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={part.url} alt={part.filename ?? "Attached image"} className="max-h-64 rounded-lg object-contain" />
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
		<div className="flex flex-wrap items-center gap-1.5 px-1">
			<Globe className="h-3 w-3 text-muted-foreground" />
			{sources.map((source) => (
				<a
					key={source.sourceId}
					href={source.url}
					target="_blank"
					rel="noopener noreferrer"
					title={source.title ?? source.url}
					className="max-w-48 truncate rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
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
			className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
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

// The stream opens with a `step-start` part that renders nothing, so "has parts" is not "has content".
function hasVisibleParts(message: ChatMessage) {
	return message.parts?.some(
		(part) => part.type === "reasoning" || part.type === "file" || (part.type === "text" && part.text.trim().length > 0),
	);
}

function MessageRow({ isUser, animate, children }: { isUser: boolean; animate: boolean; children: React.ReactNode }) {
	// Decided once on mount: a reply that takes over from the streaming indicator must not slide in again.
	const [shouldAnimate] = useState(animate);

	return (
		<div
			className={cn(
				"group/message flex gap-4",
				shouldAnimate && "animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
				isUser ? "justify-end" : "justify-start",
			)}>
			{children}
		</div>
	);
}

export function MessageList({ messages, status, onRegenerate }: MessageListProps) {
	const lastMessage = messages.at(-1);
	const isLastMessageEmpty = lastMessage?.role === "assistant" && !hasVisibleParts(lastMessage);
	const isBusy = status === "submitted" || status === "streaming";

	const displayMessages = isLastMessageEmpty ? messages.slice(0, -1) : messages;
	const showLoading = status === "submitted" || (status === "streaming" && isLastMessageEmpty);

	return (
		<div className="flex flex-col gap-4 p-4">
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
					<MessageRow key={message.id} isUser={isUser} animate={isUser || !isStreaming}>
						{!isUser && (
							<Avatar className="w-8 h-8 mt-1 shrink-0">
								<AvatarFallback className="bg-primary/10">
									<Bot size={16} className="text-primary" />
								</AvatarFallback>
							</Avatar>
						)}
						<div className={cn("flex min-w-0 flex-col gap-1.5", isUser && "items-end")}>
							<div
								className={cn(
									"rounded-2xl max-w-2xl px-4 py-3",
									isUser ? "bg-primary text-primary-foreground" : "bg-muted/50",
								)}>
								<div className="space-y-2 text-sm sm:text-base leading-relaxed">
									{message.parts?.map((part, index) => (
										<MessagePartRenderer key={index} part={part} />
									))}
								</div>
							</div>
							{!isUser && <MessageSources message={message} />}
							{(isUser || !isStreaming) && (
								<div
									className={cn(
										"flex items-center gap-1 px-1 text-xs text-muted-foreground",
										isUser && "opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 transition-opacity",
									)}>
									{text && <CopyButton text={text} />}
									{!isUser && isLast && onRegenerate && (
										<button
											type="button"
											onClick={onRegenerate}
											title="Regenerate"
											aria-label="Regenerate response"
											className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md hover:bg-accent hover:text-foreground transition-colors">
											<RotateCcw className="h-3.5 w-3.5" />
										</button>
									)}
									{details.length > 0 && <span className="pl-1">{details.join(" · ")}</span>}
								</div>
							)}
						</div>
						{isUser && (
							<Avatar className="w-8 h-8 mt-1 shrink-0">
								<AvatarFallback className="bg-primary text-primary-foreground">
									<User size={16} />
								</AvatarFallback>
							</Avatar>
						)}
					</MessageRow>
				);
			})}
			{showLoading && <StreamingIndicator />}
		</div>
	);
}
