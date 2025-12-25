"use client";

import { MessageSquare, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { use, useMemo, useState, useTransition } from "react";

import { deleteConversation } from "@/app/actions/conversationActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, groupByDate, stripMarkdown } from "@/lib/utils";
import CreateConversationButton from "./createConversationButton";
import { Conversation } from "@/lib/types";

interface SidebarContentProps {
	conversations: Promise<Conversation[]>;
}

export function SidebarContent({ conversations }: SidebarContentProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();
	const [searchQuery, setSearchQuery] = useState("");
	const conversationsData = use(conversations);

	// Extract current chat ID from pathname
	const currentId = pathname.startsWith("/chat/") ? pathname.split("/")[2] : undefined;

	// Filter and group conversations
	const filteredConversations = useMemo(() => {
		if (!searchQuery.trim()) return conversationsData;
		return conversationsData.filter((conv) => conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [conversationsData, searchQuery]);

	const groupedConversations = useMemo(() => groupByDate(filteredConversations), [filteredConversations]);

	const handleDelete = (e: React.MouseEvent, id: string) => {
		e.preventDefault();
		e.stopPropagation();
		startTransition(async () => {
			await deleteConversation(id);
			if (currentId === id) {
				router.push("/");
			}
			router.refresh();
		});
	};

	return (
		<>
			{/* New Chat Button */}
			<div className="px-3 pb-2">
				<CreateConversationButton className="w-full" conversations={conversationsData} />
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
			<ScrollArea className="flex-1 px-2">
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
										const rawTitle = conversation.lastMessage ? stripMarkdown(conversation.lastMessage) : null;
										const title = rawTitle
											? rawTitle.length > 20
												? rawTitle.substring(0, 20) + "..."
												: rawTitle
											: "New chat";

										return (
											<Link
												key={conversation.id}
												href={`/chat/${conversation.id}`}
												prefetch={true}
												className={cn(
													"group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
													isActive
														? "bg-accent text-accent-foreground"
														: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
												)}>
												<MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
												<span className="flex-1 truncate">{title}</span>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
													onClick={(e) => handleDelete(e, conversation.id)}
													disabled={isPending}>
													<Trash2 className="h-3 w-3" />
												</Button>
											</Link>
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
