import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { MessageList } from "@/components/chat/messageList";
import { Button } from "@/components/ui/button";
import { getPublicConversation } from "@/lib/data/conversation";

interface SharePageProps {
	params: Promise<{ id: string }>;
}

const getSharedConversation = cache(getPublicConversation);

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
	const { id } = await params;
	const conversation = await getSharedConversation(id);
	return { title: conversation ? `${conversation.title ?? "Shared conversation"} - Mind` : "Mind" };
}

export default async function SharePage({ params }: SharePageProps) {
	const { id } = await params;
	const conversation = await getSharedConversation(id);

	if (!conversation) {
		notFound();
	}

	return (
		<div className="flex h-screen flex-col bg-background">
			<header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
				<div className="flex min-w-0 items-center gap-3">
					<Image src="/logo.png" alt="Mind Logo" width={32} height={32} />
					<div className="min-w-0">
						<h1 className="truncate text-sm font-medium text-foreground">
							{conversation.title ?? "Shared conversation"}
						</h1>
						<p className="text-xs text-muted-foreground">Shared conversation, read only</p>
					</div>
				</div>
				<Button asChild size="sm" variant="outline">
					<Link href="/">Try Mind</Link>
				</Button>
			</header>
			<main className="flex-1 overflow-y-auto">
				<div className="max-w-4xl mx-auto px-4 py-8">
					<MessageList messages={conversation.messages} status="ready" />
				</div>
			</main>
		</div>
	);
}
