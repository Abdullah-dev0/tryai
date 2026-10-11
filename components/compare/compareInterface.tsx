"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AlertCircle, ArrowUp, Square, Trash2 } from "lucide-react";

import { MessageList } from "@/components/chat/messageList";
import { ModelSelector } from "@/components/chat/modelSelector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApiKey } from "@/contexts/apiKeyContext";
import { useActiveModel } from "@/hooks/useModels";
import { useSelectedModel } from "@/hooks/useSelectedModel";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLUMNS = [
	{ key: "tryai-compare-a", label: "Model A" },
	{ key: "tryai-compare-b", label: "Model B" },
];

function useCompareColumn(storageKey: string) {
	const { hasApiKey } = useApiKey();
	const [model, setModel] = useSelectedModel(storageKey);
	const { activeModel } = useActiveModel(model, hasApiKey);
	const [transport] = React.useState(() => new DefaultChatTransport<ChatMessage>({ api: "/api/compare" }));
	const chat = useChat<ChatMessage>({ id: storageKey, transport });
	return { ...chat, activeModel, setModel };
}

type CompareColumnState = ReturnType<typeof useCompareColumn>;

function latency(column: CompareColumnState) {
	const metadata = column.messages.findLast((message) => message.role === "assistant")?.metadata;
	if (!metadata?.durationMs) return null;
	return `First token ${((metadata.ttftMs ?? 0) / 1000).toFixed(1)}s · total ${(metadata.durationMs / 1000).toFixed(1)}s`;
}

function CompareColumn({ label, column }: { label: string; column: CompareColumnState }) {
	const isLoading = column.status === "streaming" || column.status === "submitted";

	return (
		<section aria-label={label} className="flex min-h-0 min-w-0 flex-1 flex-col">
			<div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3">
				<ModelSelector value={column.activeModel} onValueChange={column.setModel} />
				<span className="truncate text-xs text-muted-foreground">{isLoading ? "Generating…" : latency(column)}</span>
			</div>
			<div className="flex-1 overflow-y-auto">
				{column.messages.length === 0 ? (
					<p className="px-4 py-10 text-center text-sm text-muted-foreground">{label} will answer here.</p>
				) : (
					<MessageList messages={column.messages} status={column.status} />
				)}
				{column.error && (
					<div className="mx-4 mb-4 flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						<AlertCircle className="h-4 w-4 shrink-0" />
						<span>
							{column.error.message.length <= 160 ? column.error.message : "Something went wrong. Please try again."}
						</span>
					</div>
				)}
			</div>
		</section>
	);
}

export function CompareInterface() {
	const { apiKey } = useApiKey();
	const first = useCompareColumn(COLUMNS[0].key);
	const second = useCompareColumn(COLUMNS[1].key);
	const columns = [first, second];
	const [input, setInput] = React.useState("");

	const isLoading = columns.some((column) => column.status === "streaming" || column.status === "submitted");
	const hasMessages = columns.some((column) => column.messages.length > 0);
	const canSend = input.trim().length > 0 && !isLoading;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSend) return;
		for (const column of columns) {
			column.clearError();
			column.sendMessage({ text: input }, { body: { model: column.activeModel, apiKey: apiKey ?? undefined } });
		}
		setInput("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	const handleClear = () => {
		for (const column of columns) {
			column.setMessages([]);
			column.clearError();
		}
	};

	return (
		<div className="flex h-full flex-col bg-background">
			<header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b px-4">
				<div className="flex min-w-0 items-baseline gap-3">
					<h1 className="text-sm font-medium text-foreground">Compare models</h1>
					<p className="hidden truncate text-xs text-muted-foreground sm:block">
						One prompt, two models. Comparisons are not saved.
					</p>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={!hasMessages || isLoading}
					onClick={handleClear}
					className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground">
					<Trash2 className="h-3.5 w-3.5" />
					Clear
				</Button>
			</header>

			<main className="flex min-h-0 flex-1 flex-col divide-y md:flex-row md:divide-x md:divide-y-0">
				{COLUMNS.map((config, index) => (
					<CompareColumn key={config.key} label={config.label} column={columns[index]} />
				))}
			</main>

			<div className="border-t bg-background/80 backdrop-blur-sm">
				<form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 py-4">
					<div className="flex items-end gap-2 rounded-2xl border bg-card px-4 py-3 shadow-lg">
						<Textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask both models the same question..."
							disabled={isLoading}
							rows={1}
						/>
						{isLoading ? (
							<Button
								type="button"
								size="icon"
								variant="ghost"
								onClick={() => columns.forEach((column) => column.stop())}
								className="h-9 w-9 shrink-0 rounded-full"
								title="Stop generating">
								<Square className="h-4 w-4" />
							</Button>
						) : (
							<Button
								type="submit"
								size="icon"
								disabled={!canSend}
								className={cn(
									"h-9 w-9 shrink-0 rounded-full transition-all",
									canSend ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground",
								)}
								title="Send message">
								<ArrowUp className="h-4 w-4" />
							</Button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}
