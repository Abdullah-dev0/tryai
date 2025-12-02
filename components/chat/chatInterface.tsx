"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, Square, RotateCcw, AlertCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageList } from "@/components/chat/messageList";
import { ModelSelector } from "@/components/chat/modelSelector";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
	id?: string;
	initialMessages?: UIMessage[];
}

export function ChatInterface({ id, initialMessages = [] }: ChatInterfaceProps) {
	const [model, setModel] = React.useState("google/gemini-2.0-flash-exp:free");
	const [input, setInput] = React.useState("");
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const messagesEndRef = React.useRef<HTMLDivElement>(null);

	const { messages, sendMessage, status, stop, error, regenerate, setMessages } = useChat({
		id,
		messages: initialMessages,
		transport: new DefaultChatTransport({
			api: "/api/chat",
			body: { model, conversationId: id },
		}),
		experimental_throttle: 50, // Throttle UI updates for better performance
		onFinish: () => {
			textareaRef.current?.focus();
		},
		onError: (err) => {
			console.error("Chat error:", err);
		},
	});

	const isLoading = status === "streaming" || status === "submitted";
	const canRetry = status === "ready" || status === "error";
	const hasMessages = messages.length > 0;

	// Auto-scroll to bottom when new messages arrive
	React.useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, status]);

	// Auto-resize textarea
	React.useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
		}
	}, [input]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (input.trim() && status === "ready") {
			sendMessage({ text: input });
			setInput("");
			if (textareaRef.current) {
				textareaRef.current.style.height = "auto";
			}
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const handleRetry = () => {
		if (canRetry && hasMessages) {
			regenerate();
		}
	};

	const dismissError = () => {
		// Clear error state by removing any error placeholder messages
		setMessages((prev) => {
			const lastMsg = prev[prev.length - 1];
			// Check if the last message has error-like content in parts
			if (lastMsg?.role === "assistant") {
				const textParts = lastMsg.parts?.filter(
					(p): p is { type: "text"; text: string } => p.type === "text"
				);
				const hasErrorText = textParts?.some((p) => p.text.includes("error"));
				if (hasErrorText) {
					return prev.slice(0, -1);
				}
			}
			return prev;
		});
	};

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<header className="flex h-14 items-center justify-between border-b px-4">
				<h1 className="text-sm font-medium text-muted-foreground">Chat</h1>
				<ModelSelector value={model} onValueChange={setModel} />
			</header>

			{/* Messages */}
			<main className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-2xl px-4 py-8">
					<MessageList messages={messages} status={status} />
					<div ref={messagesEndRef} />
				</div>
			</main>

			{/* Error Banner */}
			{error && (
				<div className="mx-auto max-w-2xl px-4">
					<div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
						<AlertCircle className="h-4 w-4 shrink-0" />
						<span className="flex-1">Something went wrong. Please try again.</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRetry}
							className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
						>
							<RotateCcw className="h-3 w-3 mr-1" />
							Retry
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={dismissError}
							className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
						>
							<X className="h-3 w-3" />
						</Button>
					</div>
				</div>
			)}

			{/* Input */}
			<footer className="border-t p-4">
				<form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
					<div className="relative rounded-lg border bg-card">
						<Textarea
							ref={textareaRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={status === "ready" ? "Send a message..." : "Waiting for response..."}
							className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent pr-14 focus-visible:ring-0"
							disabled={status !== "ready"}
							rows={1}
						/>
						<div className="absolute bottom-2 right-2 flex gap-1">
							{/* Retry button - show when there are messages and ready/error */}
							{canRetry && hasMessages && !isLoading && (
								<Button
									type="button"
									size="icon"
									variant="ghost"
									onClick={handleRetry}
									className="h-8 w-8 text-muted-foreground hover:text-foreground"
									title="Regenerate response"
								>
									<RotateCcw className="h-4 w-4" />
								</Button>
							)}

							{/* Stop button - show when loading */}
							{isLoading ? (
								<Button
									type="button"
									size="icon"
									variant="ghost"
									onClick={stop}
									className="h-8 w-8"
									title="Stop generating"
								>
									<Square className="h-4 w-4" />
								</Button>
							) : (
								<Button
									type="submit"
									size="icon"
									disabled={!input.trim() || status !== "ready"}
									className={cn(
										"h-8 w-8",
										input.trim() && status === "ready"
											? "bg-foreground text-background hover:bg-foreground/90"
											: "bg-muted text-muted-foreground"
									)}
									title="Send message"
								>
									<ArrowUp className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
					<p className="mt-2 text-center text-xs text-muted-foreground">
						Press Enter to send, Shift + Enter for new line
					</p>
				</form>
			</footer>
		</div>
	);
}
