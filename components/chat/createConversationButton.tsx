"use client";

import { createConversation } from "@/app/actions/conversationActions";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Spinner } from "../ui/spinner";
import { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

const CreateConversationButton = ({
	conversations,
	className,
}: {
	conversations: Conversation[];
	className?: string;
}) => {
	const [isPending, startTransition] = useTransition();

	const router = useRouter();

	const handleNewChat = () => {
		startTransition(async () => {
			const emptyConversation = conversations?.find((conv) => conv.lastMessage === null);
			if (emptyConversation) {
				router.push(`/chat/${emptyConversation.id}`);
				return;
			}
			const conversation = await createConversation();
			if (conversation) {
				router.push(`/chat/${conversation.id}`);
			}
		});
	};

	return (
		<Button onClick={handleNewChat} variant={"outline"} className={cn(className )} disabled={isPending}>
			{isPending ? (
				<Spinner className="h-4 w-4" />
			) : (
				<>
					<Plus className="h-4 w-4" />
					New Chat
				</>
			)}
		</Button>
	);
};

export default CreateConversationButton;
