"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, Plus, Trash2, Search, User } from "lucide-react";
import { useTransition, useState, useMemo } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { deleteConversation, createConversation } from "@/app/actions/actions";
import { Spinner } from "@/components/ui/spinner";

interface Conversation {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	lastMessage: string | null;
}

interface SidebarContentProps {
	conversations: Conversation[];
}

// Helper to group conversations by date
function groupByDate(conversations: Conversation[]) {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
	const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

	const groups: { label: string; conversations: Conversation[] }[] = [
		{ label: "Today", conversations: [] },
		{ label: "Yesterday", conversations: [] },
		{ label: "Previous 7 Days", conversations: [] },
		{ label: "Older", conversations: [] },
	];

	conversations.forEach((conv) => {
		const date = new Date(conv.updatedAt);
		if (date >= today) {
			groups[0].conversations.push(conv);
		} else if (date >= yesterday) {
			groups[1].conversations.push(conv);
		} else if (date >= lastWeek) {
			groups[2].conversations.push(conv);
		} else {
			groups[3].conversations.push(conv);
		}
	});

	return groups.filter((g) => g.conversations.length > 0);
}

export function SidebarContent({ conversations }: SidebarContentProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();
	const [searchQuery, setSearchQuery] = useState("");

	// Extract current chat ID from pathname
	const currentId = pathname.startsWith("/chat/") ? pathname.split("/")[2] : undefined;

	// Filter and group conversations
	const filteredConversations = useMemo(() => {
		if (!searchQuery.trim()) return conversations;
		return conversations.filter((conv) => conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [conversations, searchQuery]);

	const groupedConversations = useMemo(() => groupByDate(filteredConversations), [filteredConversations]);

	const handleNewChat = () => {
		startTransition(async () => {
			const conversation = await createConversation();
			if (conversation) {
				router.push(`/chat/${conversation.id}`);
			}
		});
	};

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
		<div className="hidden w-64 flex-col bg-card md:flex">
			{/* Header with Logo */}
			<div className="flex h-14 items-center px-4">
				<Link href="/" className="text-lg font-bold hover:opacity-80 transition-opacity">
					TryAI
				</Link>
			</div>

			{/* New Chat Button */}
			<div className="px-3 pb-2">
				<Button onClick={handleNewChat} variant={"outline"} className="w-full" disabled={isPending}>
					{isPending ? (
						<Spinner className="h-4 w-4" />
					) : (
						<>
							<Plus className="h-4 w-4" />
							New Chat
						</>
					)}
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
									{group.conversations.map((conversation) => {
										const isActive = currentId === conversation.id;
										const title = conversation.lastMessage?.substring(0, 32) || "New chat";

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

			{/* User Profile */}
			<div className="border-t p-3">
				<div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors cursor-pointer">
					<div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
						<User className="h-4 w-4 text-white" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium truncate">User</p>
						<p className="text-xs text-muted-foreground">Free</p>
					</div>
				</div>
			</div>
		</div>
	);
}
