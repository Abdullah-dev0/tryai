"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { useTransition } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function SidebarContent({ conversations }: SidebarContentProps) {
	
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();

	// Extract current chat ID from pathname
	const currentId = pathname.startsWith("/chat/") ? pathname.split("/")[2] : undefined;

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
		<div className="hidden w-64 flex-col border-r bg-card md:flex">
			{/* Header */}
			<div className="flex h-14 items-center border-b px-4">
				<Link href="/" className="font-semibold hover:opacity-80 transition-opacity">
					TryAI
				</Link>
			</div>

			{/* New Chat */}
			<div className="p-3">
				<Button
					onClick={handleNewChat}
					variant="outline"
					className="w-full justify-start gap-2"
					disabled={isPending}
				>
					{isPending ? (
						<Spinner className="h-4 w-4" />
					) : (
						<Plus className="h-4 w-4" />
					)}
					New chat
				</Button>
			</div>

			{/* Conversations */}
			<ScrollArea className="flex-1">
				<div className="flex flex-col gap-1 p-2">
					{conversations.length === 0 ? (
						<p className="px-3 py-4 text-center text-sm text-muted-foreground">
							No conversations yet
						</p>
					) : (
						conversations.map((conversation) => {
							const isActive = currentId === conversation.id;
							const title = conversation.lastMessage?.substring(0, 28) || "New chat";

							return (
								<Link
									key={conversation.id}
									href={`/chat/${conversation.id}`}
									prefetch={true}
									className={cn(
										"group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
										isActive
											? "bg-accent text-accent-foreground"
											: "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
									)}
								>
									<MessageSquare className="h-4 w-4 shrink-0" />
									<span className="flex-1 truncate">{title}</span>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
										onClick={(e) => handleDelete(e, conversation.id)}
										disabled={isPending}
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								</Link>
							);
						})
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
