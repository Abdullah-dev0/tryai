import CreateConversationButton from "@/components/chat/createConversationButton";
import { Skeleton } from "@/components/ui/skeleton";
import { getConversations } from "../actions/conversationActions";
import { Suspense } from "react";

export default function HomePage() {
	return (
		<div className="h-full overflow-y-auto bg-background">
			<main className="mx-auto flex min-h-full w-full max-w-[820px] flex-col justify-center gap-8 px-6 py-12">
				<h1 className="font-display text-[clamp(44px,7vw,88px)] font-bold leading-[0.95] tracking-[-0.045em]">
					One prompt.
					<br />
					Any model.
				</h1>
				<p className="max-w-xl text-lg text-muted-foreground">
					Free models work out of the box. Add your own OpenRouter key to unlock the paid ones and web search.
				</p>
				<div>
					<Suspense fallback={<Skeleton className="h-12 w-40 rounded-full" />}>
						<ConversationButton />
					</Suspense>
				</div>
			</main>
		</div>
	);
}

async function ConversationButton() {
	const conversations = await getConversations();

	return <CreateConversationButton conversations={conversations} className="h-12 rounded-full px-6 text-base" />;
}
