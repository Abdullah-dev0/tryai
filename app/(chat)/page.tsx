"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createConversation } from "@/app/actions/actions";
import { Spinner } from "@/components/ui/spinner";

export default function HomePage() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleCreateChat = () => {
		startTransition(async () => {
			const conversation = await createConversation();
			if (conversation) {
				router.push(`/chat/${conversation.id}`);
			}
		});
	};

	return (
		<div className="flex h-full flex-col items-center justify-center bg-background">
			<div className="flex flex-col items-center gap-8 text-center">
				{/* App Logo/Icon */}
				<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-border">
					<Sparkles className="h-10 w-10 text-primary" />
				</div>

				{/* App Name */}
				<div className="space-y-2">
					<h1 className="text-4xl font-bold text-foreground">TryAI</h1>
					<p className="text-muted-foreground">Your AI-powered assistant</p>
				</div>

				{/* Create Chat Button */}
				<Button onClick={handleCreateChat} size="lg" disabled={isPending} className="gap-2 px-8">
					{isPending ? (
						<>
							<Spinner className="h-4 w-4" />
							Creating...
						</>
					) : (
						<>
							<Plus className="h-5 w-5" />
							Create New Chat
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
