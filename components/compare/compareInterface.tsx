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
		<section aria-label={label} className="flex min-h-0 min-w-0 flex-1 flex-col rounded-[20px] border bg-card">
			<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 pt-4">
				<ModelSelector value={column.activeModel} onValueChange={column.setModel} />
				<span className="truncate font-mono text-xs text-muted-foreground">{isLoading ? "Generating…" : latency(column)}</span>
			</div>
			<div className="flex-1 overflow-y-auto p-5">
				{column.messages.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">{label} will answer here.</p>
				) : (
					<MessageList messages={column.messages} status={column.status} />
				)}
				{column.error && (
					<div className="mt-4 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
		<div className="mx-auto flex h-full w-full max-w-[1200px] flex-col gap-6 bg-background px-6 pb-6 pt-7">
			<header className="flex shrink-0 flex-wrap items-center justify-between gap-4">
				<div className="flex min-w-0 flex-wrap items-baseline gap-3">
					<h1 className="font-display text-[26px] font-semibold tracking-tight">Compare models</h1>
					<p className="hidden truncate text-sm text-muted-foreground sm:block">
						One prompt, two models. Comparisons are not saved.
					</p>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					disabled={!hasMessages || isLoading}
					onClick={handleClear}
					className="h-11 gap-2 rounded-xl px-3 text-sm text-muted-foreground hover:text-foreground">
					<Trash2 className="h-4 w-4" />
					Clear
				</Button>
			</header>

			<main className="flex min-h-0 flex-1 flex-col gap-5 md:flex-row">
				{COLUMNS.map((config, index) => (
					<CompareColumn key={config.key} label={config.label} column={columns[index]} />
				))}
			</main>

			<div>
				<form onSubmit={handleSubmit}>
					<div className="flex items-end gap-2 rounded-[28px] border border-input bg-card py-2 pl-4 pr-2">
						<Textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask both models the same question..."
							disabled={isLoading}
							rows={1}
							aria-label="Prompt for both models"
							className="min-h-11 resize-none border-0 bg-transparent px-1 py-2.5 text-base shadow-none focus-visible:ring-0 md:text-base dark:bg-transparent"
						/>
						{isLoading ? (
							<Button
								type="button"
								size="icon"
								variant="ghost"
								onClick={() => columns.forEach((column) => column.stop())}
								className="h-11 w-14 shrink-0 rounded-full"
								title="Stop generating">
								<Square className="h-4 w-4" />
							</Button>
						) : (
							<Button
								type="submit"
								size="icon"
								disabled={!canSend}
								className="h-11 w-14 shrink-0 rounded-full"
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
