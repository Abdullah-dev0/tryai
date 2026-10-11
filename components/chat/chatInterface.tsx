"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import type { ChatMessage } from "@/lib/types";
import { ArrowRight, Square, AlertCircle, Download, Globe, ImagePlus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, messagesToMarkdown } from "@/lib/utils";
import { ModelSelector } from "@/components/chat/modelSelector";
import { ShareDialog } from "@/components/chat/shareDialog";
import { SUGGESTED_PROMPTS } from "@/lib/constants";
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

	const composer = (
		<form onSubmit={handleSubmit} className="rounded-[22px] border border-input bg-card p-3">
			{attachedImages.length > 0 && (
				<div className="flex flex-wrap gap-2 px-2 pb-2 pt-1">
					{attachedImages.map((image, index) => (
						<div key={index} className="relative">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={image.url}
								alt={image.filename ?? "Attached image"}
								className="h-16 w-16 rounded-xl border object-cover"
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

			<Textarea
				ref={textareaRef}
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={showMessageList ? "Ask a follow-up" : "What are you working on?"}
				aria-label="Message"
				disabled={isLoading}
				rows={showMessageList ? 1 : 2}
				className="min-h-0 resize-none border-0 bg-transparent px-2 py-1.5 text-base shadow-none focus-visible:ring-0 md:text-base dark:bg-transparent"
			/>

			<div className="flex flex-wrap items-center justify-between gap-2 pt-2">
				<div className="flex flex-wrap items-center gap-2">
					<ModelSelector value={activeModel} onValueChange={setModel} commandTarget />
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="icon"
								aria-label="Attach images"
								aria-disabled={!supportsImages}
								onClick={() => supportsImages && fileInputRef.current?.click()}
								className={cn("h-11 w-11 rounded-full bg-transparent", !supportsImages && "opacity-50")}>
								<ImagePlus className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="top">
							{supportsImages ? `Attach up to ${MAX_IMAGES_PER_MESSAGE} images` : "Pick a model that can read images"}
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="icon"
								aria-label="Web search"
								aria-pressed={useWebSearch}
								aria-disabled={!hasApiKey}
								onClick={() => hasApiKey && setWebSearch((prev) => !prev)}
								className={cn(
									"h-11 w-11 rounded-full bg-transparent",
									useWebSearch && "border-primary text-primary",
									!hasApiKey && "opacity-50",
								)}>
								<Globe className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="top">
							{hasApiKey
								? "Search the web. OpenRouter bills each search to your key"
								: "Add your own API key to use web search"}
						</TooltipContent>
					</Tooltip>
					<input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
					{sessionTokens > 0 && (
						<span className="px-1 font-mono text-xs text-muted-foreground">
							{sessionTokens.toLocaleString()} tokens
						</span>
					)}
				</div>

				{isLoading ? (
					<Button
						type="button"
						variant="outline"
						onClick={stop}
						aria-label="Stop generating"
						className="h-11 w-14 rounded-full bg-transparent">
						<Square className="h-4 w-4" />
					</Button>
				) : (
					<Button type="submit" disabled={!canSend} aria-label="Send message" className="h-11 w-14 rounded-full">
						<ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.6} />
					</Button>
				)}
			</div>
		</form>
	);

	const errorBanner = error && (
		<div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
			<AlertCircle className="h-4 w-4 shrink-0" />
			<span className="flex-1">{errorMessage}</span>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => regenerate({ body: requestBody })}
				className="h-8 gap-1.5 rounded-lg px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/20">
				<RotateCcw className="h-3.5 w-3.5" />
				Retry
			</Button>
		</div>
	);

	if (!showMessageList) {
		return (
			<div className="h-full overflow-y-auto bg-background">
				<div className="mx-auto flex min-h-full w-full max-w-[820px] flex-col justify-center gap-8 px-6 py-12">
					<h1 className="font-display text-[clamp(44px,7vw,88px)] font-bold leading-[0.95] tracking-[-0.045em]">
						One prompt.
						<br />
						Any model.
					</h1>
					{errorBanner}
					{composer}
					<div className="flex flex-wrap gap-2">
						{SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
							<Button
								key={prompt}
								type="button"
								variant="outline"
								onClick={() => handlePromptClick(prompt)}
								className="h-auto min-h-11 whitespace-normal rounded-full bg-transparent px-4 py-2 text-left text-sm font-normal text-foreground/85">
								{prompt}
							</Button>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col bg-background">
			<main className="flex-1 overflow-y-auto px-6 pt-7">
				<div className="mx-auto flex w-full max-w-[740px] flex-col gap-7 pb-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h1 className="min-w-0 truncate font-display text-[26px] font-semibold tracking-tight">
							{title ?? "New chat"}
						</h1>
						{id && (
							<div className="flex shrink-0 items-center gap-1">
								<Button
									type="button"
									variant="ghost"
									onClick={handleExport}
									className="h-11 gap-2 rounded-xl px-3 text-sm text-muted-foreground hover:text-foreground">
									<Download className="h-4 w-4" />
									Export
								</Button>
								<ShareDialog id={id} initialIsPublic={isPublic} />
							</div>
						)}
					</div>
					<MessageList messages={messages} status={status} onRegenerate={() => regenerate({ body: requestBody })} />
					<div ref={messagesEndRef} />
				</div>
			</main>

			<div className="px-6 pb-6">
				<div className="mx-auto flex w-full max-w-[740px] flex-col gap-2">
					{errorBanner}
					{composer}
				</div>
			</div>
		</div>
	);
}
