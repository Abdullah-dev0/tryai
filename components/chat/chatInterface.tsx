"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import type { ChatMessage } from "@/lib/types";
import { ArrowUp, Square, AlertCircle, Download, Globe, ImagePlus, RotateCcw, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, messagesToMarkdown } from "@/lib/utils";
import { ModelSelector } from "@/components/chat/modelSelector";
import { ShareDialog } from "@/components/chat/shareDialog";
import { QUICK_ACTIONS, SUGGESTED_PROMPTS } from "@/lib/constants";
import { MAX_IMAGES_PER_MESSAGE } from "@/lib/limits";
import { imageFileToPart } from "@/lib/image";
import { MessageList } from "./messageList";
import { useApiKey } from "@/contexts/apiKeyContext";
import { useActiveModel } from "@/hooks/useModels";
import { useSelectedModel } from "@/hooks/useSelectedModel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatInterfaceProps {
	id?: string;
	initialMessages?: ChatMessage[];
	totalTokens?: number;
	title?: string | null;
	isPublic?: boolean;
}

export function ChatInterface({
	id,
	initialMessages = [],
	totalTokens = 0,
	title = null,
	isPublic = false,
}: ChatInterfaceProps) {
	const router = useRouter();
	const { apiKey, hasApiKey } = useApiKey();
	const [model, setModel] = useSelectedModel();
	const { activeModel, supportsImages } = useActiveModel(model, hasApiKey);
	const [input, setInput] = React.useState("");
	const [images, setImages] = React.useState<FileUIPart[]>([]);
	const [webSearch, setWebSearch] = React.useState(false);
	const [sessionTokens, setSessionTokens] = React.useState(totalTokens);
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const messagesEndRef = React.useRef<HTMLDivElement>(null);

	const { messages, sendMessage, status, stop, error, regenerate } = useChat<ChatMessage>({
		id,
		messages: initialMessages,
		transport: new DefaultChatTransport({
			api: "/api/chat",
			prepareSendMessagesRequest({ messages, id, body }) {
				return {
					body: {
						message: messages[messages.length - 1],
						conversationId: id,
						...body,
					},
				};
			},
		}),
		onFinish: ({ message, messages: allMessages }) => {
			const tokens = message.metadata?.tokens ?? 0;
			setSessionTokens((prev) => prev + tokens);
			textareaRef.current?.focus();
			const isFirstInteraction = allMessages.length === 2;
			if (isFirstInteraction) {
				router.refresh();
			}
		},
		onError: (err) => {
			console.error("Chat error:", err);
		},
	});

	const isLoading = status === "streaming" || status === "submitted";
	const showMessageList = messages.length > 0;
	const useWebSearch = webSearch && hasApiKey;
	const attachedImages = supportsImages ? images : [];
	const canSend = (input.trim().length > 0 || attachedImages.length > 0) && !isLoading;
	const requestBody = { model: activeModel, apiKey: apiKey ?? undefined, webSearch: useWebSearch };
	const errorMessage =
		error?.message && error.message.length <= 160 ? error.message : "Something went wrong. Please try again.";

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
		if (!canSend) return;
		sendMessage(input.trim() ? { text: input, files: attachedImages } : { files: attachedImages }, {
			body: requestBody,
		});
		setInput("");
		setImages([]);
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const handlePromptClick = (prompt: string) => {
		setInput(prompt);
		textareaRef.current?.focus();
	};

	const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES_PER_MESSAGE - images.length);
		e.target.value = "";
		try {
			const parts = await Promise.all(files.map(imageFileToPart));
			setImages((prev) => [...prev, ...parts].slice(0, MAX_IMAGES_PER_MESSAGE));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not attach image");
		}
	};

	const handleExport = () => {
		const url = URL.createObjectURL(
			new Blob([messagesToMarkdown(title ?? "Conversation", messages)], { type: "text/markdown" }),
		);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${(title ?? "conversation").replace(/[^\w\- ]+/g, "").trim() || "conversation"}.md`;
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="flex h-full flex-col bg-background relative">
			{id && showMessageList && (
				<header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b px-4">
					<h1 className="truncate text-sm font-medium text-foreground">{title ?? "New chat"}</h1>
					<div className="flex shrink-0 items-center gap-1">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleExport}
							className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground">
							<Download className="h-3.5 w-3.5" />
							Export
						</Button>
						<ShareDialog id={id} initialIsPublic={isPublic} />
					</div>
				</header>
			)}

			{/* Main Content */}
			<main className="flex-1 overflow-y-auto">
				{showMessageList ? (
					<div className="max-w-4xl mx-auto px-4 py-8">
						<MessageList
							messages={messages}
							status={status}
							onRegenerate={() => regenerate({ body: requestBody })}
						/>
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
								{QUICK_ACTIONS.map((action) => (
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
								{SUGGESTED_PROMPTS.map((prompt) => (
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
				<div className="mx-auto max-w-2xl px-4 pb-2">
					<div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
						<AlertCircle className="h-4 w-4 shrink-0" />
						<span className="flex-1">{errorMessage}</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => regenerate({ body: requestBody })}
							className="h-7 gap-1.5 rounded-md px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/20">
							<RotateCcw className="h-3.5 w-3.5" />
							Retry
						</Button>
					</div>
				</div>
			)}

			{/* Input */}
			<div className="border-t bg-background/80 backdrop-blur-sm">
				<form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 py-4">
					<div className="rounded-2xl border bg-card shadow-lg">
						{attachedImages.length > 0 && (
							<div className="flex flex-wrap gap-2 px-4 pt-4">
								{attachedImages.map((image, index) => (
									<div key={index} className="relative">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={image.url}
											alt={image.filename ?? "Attached image"}
											className="h-16 w-16 rounded-lg border object-cover"
										/>
										<button
											type="button"
											onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
											aria-label="Remove image"
											className="absolute -right-1.5 -top-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground">
											<X className="h-3 w-3" />
										</button>
									</div>
								))}
							</div>
						)}

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
								<ModelSelector value={activeModel} onValueChange={setModel} commandTarget />
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											aria-pressed={useWebSearch}
											aria-disabled={!hasApiKey}
											onClick={() => hasApiKey && setWebSearch((prev) => !prev)}
											className={cn(
												"h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground",
												useWebSearch && "bg-accent text-foreground",
												!hasApiKey && "opacity-50",
											)}>
											<Globe className="h-3.5 w-3.5" />
											Search
										</Button>
									</TooltipTrigger>
									<TooltipContent side="top">
										{hasApiKey
											? "Search the web. OpenRouter bills each search to your key"
											: "Add your own API key to use web search"}
									</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											aria-label="Attach images"
											aria-disabled={!supportsImages}
											onClick={() => supportsImages && fileInputRef.current?.click()}
											className={cn(
												"h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground",
												!supportsImages && "opacity-50",
											)}>
											<ImagePlus className="h-3.5 w-3.5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="top">
										{supportsImages
											? `Attach up to ${MAX_IMAGES_PER_MESSAGE} images`
											: "Pick a model that can read images"}
									</TooltipContent>
								</Tooltip>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									multiple
									hidden
									onChange={handleFiles}
								/>
								{sessionTokens > 0 && (
									<span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
										<Zap className="h-3 w-3" />
										{sessionTokens.toLocaleString()} tokens
									</span>
								)}
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
										disabled={!canSend}
										className={cn(
											"h-9 w-9 rounded-full transition-all",
											canSend
												? "bg-primary text-primary-foreground hover:bg-primary/90"
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
