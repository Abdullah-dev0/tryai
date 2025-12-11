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
	part: UIMessage["parts"][number];
	index: number;
	status: ChatStatus;
}

function MessagePartRenderer({ part, index }: MessagePartRendererProps) {
	switch (part.type) {
		case "reasoning":
			return (
				<details key={index} className="group">
					<summary className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
						<Brain className="h-3 w-3" />
						<span>View reasoning</span>
					</summary>
					<pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{part.text}</pre>
				</details>
			);
		case "text":
			return <Streamdown>{part.text}</Streamdown>;
		default:
			return null;
	}
}

export function MessageList({ messages, status }: MessageListProps) {
	const lastMessage = messages.at(-1);
	const isLastMessageEmpty = lastMessage?.role === "assistant" && !lastMessage.parts?.length;

	const displayMessages = isLastMessageEmpty ? messages.slice(0, -1) : messages;
	const showLoading = status === "submitted" || (status === "streaming" && isLastMessageEmpty);

	return (
		<div className="flex flex-col gap-4 p-4">
			{displayMessages.map((message) => {
				const isUser = message.role === "user";

				return (
					<div
						key={message.id}
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
						<div className="flex flex-col gap-2">
							<div
								className={cn(
									"rounded-2xl max-w-2xl px-4 py-3",
									isUser ? "bg-primary text-primary-foreground" : "bg-muted/50",
								)}>
								<div className="space-y-2 text-sm sm:text-base leading-relaxed">
									{message.parts?.map((part, index) => (
										<MessagePartRenderer key={index} part={part} index={index} status={status} />
									))}
								</div>
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
			})}
			{showLoading && <StreamingIndicator />}
		</div>
	);
}
