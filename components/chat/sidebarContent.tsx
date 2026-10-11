"use client";

import {
	BarChart3,
	Columns2,
	Loader2,
	MessageSquare,
	MoreHorizontal,
	Pencil,
	Pin,
	PinOff,
	Search,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";

import {
	deleteConversation,
	renameConversation,
	searchConversations,
	setConversationPinned,
} from "@/app/actions/conversationActions";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, groupByDate, titleFromText } from "@/lib/utils";
import { CommandPalette } from "./commandPalette";
import CreateConversationButton from "./createConversationButton";
import { Conversation, ConversationSearchResult } from "@/lib/types";
import { toast } from "sonner";

interface SidebarContentProps {
	conversations: Promise<Conversation[]>;
}

function conversationTitle(conversation: Conversation) {
	if (conversation.title) return conversation.title;
	return conversation.lastMessage ? titleFromText(conversation.lastMessage, 30) : "New chat";
}

export function SidebarContent({ conversations }: SidebarContentProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [busyId, setBusyId] = useState<string | null>(null);
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState("");
	const skipRenameRef = useRef(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<{ query: string; items: ConversationSearchResult[] }>({
		query: "",
		items: [],
	});
	const conversationsData = use(conversations);
	const query = searchQuery.trim().toLowerCase();

	// Extract current chat ID from pathname
	const currentId = pathname.startsWith("/chat/") ? pathname.split("/")[2] : undefined;

	useEffect(() => {
		if (query.length < 2) return;
		let cancelled = false;
		const timer = setTimeout(async () => {
			const items = await searchConversations(query);
			if (!cancelled) setSearchResults({ query, items });
		}, 300);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [query]);

	const snippets = useMemo(() => {
		const items = searchResults.query === query ? searchResults.items : [];
		return new Map(items.map((item) => [item.conversationId, item.snippet]));
	}, [searchResults, query]);

	// Filter and group conversations
	const filteredConversations = useMemo(() => {
		if (!query) return conversationsData;
		return conversationsData.filter(
			(conv) => conversationTitle(conv).toLowerCase().includes(query) || snippets.has(conv.id),
		);
	}, [conversationsData, query, snippets]);

	const groupedConversations = useMemo(() => {
		const pinned = filteredConversations.filter((conv) => conv.pinned);
		const groups = groupByDate(filteredConversations.filter((conv) => !conv.pinned));
		return pinned.length > 0 ? [{ label: "Pinned", items: pinned }, ...groups] : groups;
	}, [filteredConversations]);

	const runAction = async (id: string, action: () => Promise<void>, failure: string) => {
		setBusyId(id);
		try {
			await action();
			router.refresh();
		} catch (error) {
			toast.error(failure, {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setBusyId(null);
		}
	};

	const handleDelete = (id: string) =>
		runAction(
			id,
			async () => {
				await deleteConversation(id);
				toast.success("Conversation deleted successfully");
				if (currentId === id) {
					router.push("/");
				}
			},
			"Failed to delete conversation",
		);

	const handleRename = (id: string) => {
		const title = renameValue.trim();
		const skip = skipRenameRef.current;
		skipRenameRef.current = false;
		setRenamingId(null);
		if (skip || !title) return;
		runAction(id, () => renameConversation(id, title), "Failed to rename conversation");
	};

	return (
		<>
			<CommandPalette conversations={conversationsData} />

			{/* New Chat Button */}
			<div className="px-3 pb-2">
				<CreateConversationButton className="w-full" conversations={conversationsData} />
			</div>

			<div className="flex gap-1 px-3 pb-2">
				<Button asChild variant="ghost" size="sm" className="h-8 flex-1 gap-1.5 text-xs text-muted-foreground">
					<Link href="/compare">
						<Columns2 className="h-3.5 w-3.5" />
						Compare
					</Link>
				</Button>
				<Button asChild variant="ghost" size="sm" className="h-8 flex-1 gap-1.5 text-xs text-muted-foreground">
					<Link href="/usage">
						<BarChart3 className="h-3.5 w-3.5" />
						Usage
					</Link>
				</Button>
			</div>

			{/* Search */}
			<div className="px-3 pb-3">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search your threads..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 h-9 bg-background/50 border-border/50 rounded-lg text-sm placeholder:text-muted-foreground/60"
					/>
				</div>
			</div>

			{/* Conversations */}
			<ScrollArea className="flex-1 px-2 [&>[data-radix-scroll-area-viewport]>div]:block!">
				{groupedConversations.length === 0 ? (
					<p className="px-3 py-8 text-center text-sm text-muted-foreground">
						{searchQuery ? "No results found" : "No conversations yet"}
					</p>
				) : (
					<div className="space-y-4 pb-4">
						{groupedConversations.map((group) => (
							<div key={group.label}>
								<p className="px-3 py-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
									{group.label}
								</p>
								<div className="space-y-0.5">
									{group.items.map((conversation) => {
										const isActive = currentId === conversation.id;
										const isBusy = busyId === conversation.id;
										const snippet = snippets.get(conversation.id);

										if (renamingId === conversation.id) {
											return (
												<div key={conversation.id} className="px-1 py-1">
													<Input
														autoFocus
														value={renameValue}
														maxLength={100}
														aria-label="Conversation title"
														onChange={(e) => setRenameValue(e.target.value)}
														onBlur={() => handleRename(conversation.id)}
														onKeyDown={(e) => {
															if (e.key === "Enter") e.currentTarget.blur();
															if (e.key === "Escape") {
																skipRenameRef.current = true;
																e.currentTarget.blur();
															}
														}}
														className="h-9 text-sm"
													/>
												</div>
											);
										}

										return (
											<div
												key={conversation.id}
												className={cn(
													"group flex items-center rounded-lg pr-1 text-sm transition-colors",
													isActive
														? "bg-accent text-accent-foreground"
														: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
												)}>
												<Link
													href={`/chat/${conversation.id}`}
													prefetch={true}
													className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
													{conversation.pinned ? (
														<Pin className="h-4 w-4 shrink-0 opacity-60" />
													) : (
														<MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
													)}
													<span className="min-w-0 flex-1">
														<span className="block truncate">{conversationTitle(conversation)}</span>
														{snippet && (
															<span className="block truncate text-xs text-muted-foreground/70">{snippet}</span>
														)}
													</span>
												</Link>
												<DropdownMenu modal={false}>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															aria-label="Conversation actions"
															disabled={isBusy}
															className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100">
															{isBusy ? (
																<Loader2 className="h-3 w-3 animate-spin" />
															) : (
																<MoreHorizontal className="h-3.5 w-3.5" />
															)}
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
														<DropdownMenuItem
															onSelect={() =>
																runAction(
																	conversation.id,
																	() => setConversationPinned(conversation.id, !conversation.pinned),
																	"Failed to update conversation",
																)
															}>
															{conversation.pinned ? <PinOff /> : <Pin />}
															{conversation.pinned ? "Unpin" : "Pin"}
														</DropdownMenuItem>
														<DropdownMenuItem
															onSelect={() => {
																setRenameValue(conversation.title ?? conversationTitle(conversation));
																setRenamingId(conversation.id);
															}}>
															<Pencil />
															Rename
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onSelect={() => handleDelete(conversation.id)}
															className="text-destructive focus:bg-destructive/10 focus:text-destructive">
															<Trash2 />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										);
									})}
								</div>
							</div>
						))}
					</div>
				)}
			</ScrollArea>
		</>
	);
}
