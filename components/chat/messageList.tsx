"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import { Bot, Brain, Loader2, User } from "lucide-react";
import { Streamdown } from "streamdown";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface MessageListProps {
	messages: UIMessage[];
	status: ChatStatus;
}

function EmptyState() {
	return (
		<div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
			<div className="mb-4 text-4xl">👋</div>
			<h2 className="text-lg font-medium">How can I help you today?</h2>
			<p className="mt-1 text-sm text-muted-foreground">Start a conversation by typing a message below.</p>
		</div>
	);
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	part: any;
	index: number;
}

function MessagePartRenderer({ part, index }: MessagePartRendererProps) {
	// Text parts
	if (part.type === "text") {
		return <Streamdown>{part.text}</Streamdown>;
	}

	// Reasoning parts (for models like DeepSeek R1, Claude)
	if (part.type === "reasoning") {
		return (
			<details key={index} className="group">
				<summary className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
					<Brain className="h-3 w-3" />
					<span>View reasoning</span>
				</summary>
				<pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{part.text}</pre>
			</details>
		);
	}

	return null;
}

interface MessageItemProps {
	message: UIMessage;
}

function MessageItem({ message }: MessageItemProps) {
	const isUser = message.role === "user";

	return (
		<div
			className={cn(
				"flex gap-4 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-2",
				isUser ? "justify-end" : "justify-start",
			)}>
			{!isUser && (
				<Avatar className="w-8 h-8 mt-1 shrink-0">
					<AvatarFallback className="bg-primary/10">
						<Bot size={16} className="text-primary" />
					</AvatarFallback>
				</Avatar>
			)}
			<div
				className={cn(
					"rounded-2xl max-w-2xl px-4 py-3",
					isUser ? "bg-primary text-primary-foreground" : "bg-muted/50",
				)}>
				<div className="space-y-2 text-sm sm:text-base leading-relaxed">
					{message.parts?.map((part, index) => (
						<MessagePartRenderer key={index} part={part} index={index} />
					))}
				</div>
			</div>
			{isUser && (
				<Avatar className="w-8 h-8 mt-1 shrink-0">
					<AvatarFallback className="bg-primary text-primary-foreground">
						<User size={16} />
					</AvatarFallback>
				</Avatar>
			)}
		</div>
	);
}

export function MessageList({ messages, status }: MessageListProps) {
	const isStreaming = status === "streaming" || status === "submitted";
	const showStreamingIndicator = status === "submitted";

	if (!messages.length && !isStreaming) {
		return <EmptyState />;
	}

	return (
		<div className="flex flex-col gap-4 p-4">
			{messages.map((message) => (
				<MessageItem key={message.id} message={message} />
			))}
			{showStreamingIndicator && <StreamingIndicator />}
		</div>
	);
}
