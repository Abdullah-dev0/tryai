"use client";

import * as React from "react";
import { BarChart3, Columns2, Cpu, MessageSquare, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { createConversation } from "@/app/actions/conversationActions";
import { OPEN_MODEL_SELECTOR_EVENT } from "@/components/chat/modelSelector";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import type { Conversation } from "@/lib/types";
import { titleFromText } from "@/lib/utils";

interface CommandPaletteProps {
	conversations: Conversation[];
}

export function CommandPalette({ conversations }: CommandPaletteProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [open, setOpen] = React.useState(false);

	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const run = (action: () => void) => {
		setOpen(false);
		action();
	};

	const handleNewChat = async () => {
		const emptyConversation = conversations.find((conv) => conv.lastMessage === null);
		if (emptyConversation) {
			router.push(`/chat/${emptyConversation.id}`);
			return;
		}
		const conversation = await createConversation();
		if (conversation) {
			router.push(`/chat/${conversation.id}`);
		}
	};

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<DialogTitle className="sr-only">Command palette</DialogTitle>
			<CommandInput placeholder="Type a command or search chats..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Actions">
					<CommandItem onSelect={() => run(handleNewChat)}>
						<Plus />
						New chat
					</CommandItem>
					{pathname.startsWith("/chat/") && (
						<CommandItem
							onSelect={() =>
								run(() => setTimeout(() => window.dispatchEvent(new Event(OPEN_MODEL_SELECTOR_EVENT)), 150))
							}>
							<Cpu />
							Change model
						</CommandItem>
					)}
					<CommandItem onSelect={() => run(() => router.push("/compare"))}>
						<Columns2 />
						Compare models
					</CommandItem>
					<CommandItem onSelect={() => run(() => router.push("/usage"))}>
						<BarChart3 />
						Usage
					</CommandItem>
				</CommandGroup>
				{conversations.length > 0 && (
					<CommandGroup heading="Chats">
						{conversations.map((conversation) => (
							<CommandItem
								key={conversation.id}
								value={`${conversation.title ?? conversation.lastMessage ?? "New chat"} ${conversation.id}`}
								onSelect={() => run(() => router.push(`/chat/${conversation.id}`))}>
								<MessageSquare />
								<span className="truncate">
									{conversation.title ?? titleFromText(conversation.lastMessage ?? "")}
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				)}
			</CommandList>
		</CommandDialog>
	);
}
