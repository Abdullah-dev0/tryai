"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
	ArrowUp,
	Square,
	RotateCcw,
	AlertCircle,
	X,
	Sparkles,
	Compass,
	Code2,
	GraduationCap,
	Globe,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageList } from "@/components/chat/messageList";
import { cn } from "@/lib/utils";
import { ModelSelector } from "@/components/chat/modelSelector";

const quickActions = [
	{ icon: Sparkles, label: "Create", color: "text-purple-400" },
	{ icon: Compass, label: "Explore", color: "text-blue-400" },
	{ icon: Code2, label: "Code", color: "text-green-400" },
	{ icon: GraduationCap, label: "Learn", color: "text-orange-400" },
];

const suggestedPrompts = [
	"How does AI work?",
	"Are black holes real?",
	'How many Rs are in the word "strawberry"?',
	"What is the meaning of life?",
];

interface ChatInterfaceProps {
	id?: string;
	initialMessages?: UIMessage[];
}

export function ChatInterface({ id, initialMessages = [] }: ChatInterfaceProps) {
	const [model, setModel] = React.useState("arcee-ai/trinity-mini:free");
	const [input, setInput] = React.useState("");
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const messagesEndRef = React.useRef<HTMLDivElement>(null);

	const { messages, sendMessage, status, stop, error, regenerate, setMessages } = useChat({
		id,
		messages: initialMessages,
		transport: new DefaultChatTransport({
			api: "/api/chat",
			prepareSendMessagesRequest({ messages, body }) {
				return { body: { message: messages[messages.length - 1], body, conversationId: id } };
			},
		}),
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
	}, [status]);

	// Auto-resize textarea
	React.useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
		}
	}, [input]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (input.trim() && !isLoading) {
			sendMessage(
				{ text: input },
				{
					body: {
						model,
						conversationId: id,
					},
				},
			);
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
				const textParts = lastMsg.parts?.filter((p): p is { type: "text"; text: string } => p.type === "text");
				const hasErrorText = textParts?.some((p) => p.text.includes("error"));
				if (hasErrorText) {
					return prev.slice(0, -1);
				}
			}
			return prev;
		});
	};

	const handlePromptClick = (prompt: string) => {
		setInput(prompt);
		textareaRef.current?.focus();
	};

	return (
		<div className="flex h-full flex-col bg-background relative">
			{/* Main Content */}
			<main className="flex-1 overflow-y-auto">
				{hasMessages ? (
					<div className="max-w-4xl mx-auto px-4 py-8">
						<MessageList messages={messages} status={status} />
						<div ref={messagesEndRef} />
					</div>
				) : (
					/* Welcome Screen */
					<div className="flex flex-col items-center justify-center h-full px-4">
						<div className="max-w-2xl w-full space-y-8">
							{/* Greeting */}
							<div className="text-center space-y-2">
								<h1 className="text-3xl font-semibold text-foreground">How can I help you today?</h1>
							</div>

							{/* Quick Actions */}
							<div className="flex flex-wrap justify-center gap-3">
								{quickActions.map((action) => (
									<Button
										key={action.label}
										variant="outline"
										className="gap-2 rounded-full px-4 py-2 h-auto border-border/50 hover:bg-accent/50"
										onClick={() => handlePromptClick(`Help me ${action.label.toLowerCase()}`)}>
										<action.icon className={cn("h-4 w-4", action.color)} />
										<span>{action.label}</span>
									</Button>
								))}
							</div>

							{/* Suggested Prompts */}
							<div className="space-y-2">
								{suggestedPrompts.map((prompt) => (
									<Button
										key={prompt}
										onClick={() => handlePromptClick(prompt)}
										className="w-full text-left px-4 py-3 rounded-xl bg-card/50 hover:bg-card border border-border/30 hover:border-border/50 transition-colors text-muted-foreground hover:text-foreground">
										{prompt}
									</Button>
								))}
							</div>
						</div>
					</div>
				)}
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
							className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
							<RotateCcw className="h-3 w-3 mr-1" />
							Retry
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={dismissError}
							className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
							<X className="h-3 w-3" />
						</Button>
					</div>
				</div>
			)}

			{/* Input */}
			<div className="border-t bg-background/80 backdrop-blur-sm">
				<form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 py-4">
					<div className="rounded-2xl border bg-card shadow-lg">
						{/* Textarea */}
						<div className="relative px-4 pt-4 pb-2">
							<Textarea
								ref={textareaRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Type your message here..."
								disabled={isLoading}
								rows={1}
							/>
						</div>

						{/* Bottom bar with model selector and actions */}
						<div className="flex items-center justify-between px-3 pb-3">
							<div className="flex items-center gap-1">
								<ModelSelector value={model} onValueChange={setModel} />
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground">
									<Globe className="h-3.5 w-3.5" />
									Search
								</Button>
							</div>

							<div className="flex items-center gap-1">
								{isLoading ? (
									<Button
										type="button"
										size="icon"
										variant="ghost"
										onClick={stop}
										className="h-9 w-9 rounded-full"
										title="Stop generating">
										<Square className="h-4 w-4" />
									</Button>
								) : (
									<Button
										type="submit"
										size="icon"
										disabled={!input.trim() || isLoading}
										className={cn(
											"h-9 w-9 rounded-full transition-all",
											input.trim() && !isLoading
												? "bg-emerald-500 text-white hover:bg-emerald-600"
												: "bg-muted text-muted-foreground",
										)}
										title="Send message">
										<ArrowUp className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
